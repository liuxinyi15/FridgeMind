import { scoreRecipeDocument, type OcrDocumentResult, type OcrLine, type RecipeOcrPass } from '../../domain/recipeOcr';
import { loadOcrSource, OcrProcessingError, prepareOcrVariant, yieldToBrowser, type OcrImageVariant } from './prepareOcrImage';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrOptions {
  onProgress?: (progress: OcrProgress) => void;
  signal?: AbortSignal;
}

export interface GenericOcrRuntime {
  inputWidth: number;
  inputHeight: number;
  scaledWidth: number;
  scaledHeight: number;
  maxTilePixels: number;
  tiled: boolean;
  tileCount: number;
  preprocessingMs: number;
  recognitionMs: number;
}

export interface GenericOcrResult {
  text: string;
  pass: 'primary' | 'contrast';
  runtime: GenericOcrRuntime;
}

export interface GenericOcrOptions extends OcrOptions {
  mode?: 'receipt' | 'package';
  acceptText?: (text: string) => boolean;
}

/**
 * Local browser OCR boundary. Tesseract.js and its worker/language assets are
 * loaded only when this function is called; image pixels are not sent to an API.
 */
export async function recogniseImageText(image: File | Blob | string, options: GenericOcrOptions = {}): Promise<GenericOcrResult> {
  options.onProgress?.({ status: 'preparing_image', progress: .01 });
  if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
  const loadStartedAt = performance.now();
  const source = await loadOcrSource(image);
  let preprocessingMs = performance.now() - loadStartedAt;
  let tesseract: typeof import('tesseract.js');
  try { tesseract = await import('tesseract.js'); } catch (error) {
    source.close(); throw new OcrProcessingError('worker_failed', undefined, { cause: error });
  }
  const { createWorker, PSM } = tesseract;
  let progressBase = .05;
  let progressWeight = .03;
  let progressStatus = options.mode === 'receipt' ? 'reading_receipt' : 'reading_package';
  let worker: Awaited<ReturnType<typeof createWorker>>;
  try {
    worker = await createWorker('eng', undefined, {
      logger: (message) => options.onProgress?.({ status: progressStatus, progress: Math.min(.96, progressBase + message.progress * progressWeight) }),
    });
  } catch (error) {
    source.close(); throw new OcrProcessingError('worker_failed', undefined, { cause: error });
  }
  let workerTerminated = false;
  const terminateWorker = async () => {
    if (workerTerminated) return;
    workerTerminated = true;
    await worker.terminate().catch(() => undefined);
  };
  const abort = () => { void terminateWorker(); };
  options.signal?.addEventListener('abort', abort, { once: true });
  let recognitionMs = 0;
  const passes: Array<{ pass: 'primary' | 'contrast'; variant: OcrImageVariant; psm: Tesseract.PSM; start: number; end: number }> = [
    { pass: 'primary', variant: 'primary', psm: PSM.AUTO, start: .08, end: .76 },
    { pass: 'contrast', variant: 'contrast', psm: PSM.SINGLE_BLOCK, start: .76, end: .96 },
  ];
  try {
    for (const configuration of passes) {
      if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
      progressStatus = configuration.pass === 'primary'
        ? options.mode === 'receipt' ? 'reading_receipt' : 'reading_package'
        : options.mode === 'receipt' ? 'checking_items' : 'checking_product';
      options.onProgress?.({ status: progressStatus, progress: configuration.start });
      await yieldToBrowser();
      await worker.setParameters({ tessedit_pageseg_mode: configuration.psm, preserve_interword_spaces: '1', user_defined_dpi: '300' });
      const tileTexts: string[] = [];
      for (const tile of source.tiles) {
        if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
        await yieldToBrowser();
        const prepStartedAt = performance.now();
        const prepared = prepareOcrVariant(source, configuration.variant, tile);
        preprocessingMs += performance.now() - prepStartedAt;
        const passSpan = configuration.end - configuration.start;
        progressBase = configuration.start + passSpan * tile.index / source.tiles.length;
        progressWeight = passSpan / source.tiles.length;
        try {
          const recognitionStartedAt = performance.now();
          const result = await worker.recognize(prepared.canvas);
          recognitionMs += performance.now() - recognitionStartedAt;
          tileTexts.push(result.data.text);
        } catch (error) {
          if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
          throw new OcrProcessingError('recognition_failed', undefined, { cause: error });
        } finally {
          prepared.release();
        }
      }
      const text = mergeTileText(tileTexts);
      const accepted = options.acceptText ? options.acceptText(text) : Boolean(text.trim());
      if (accepted || configuration.pass === 'contrast') {
        options.onProgress?.({ status: progressStatus, progress: .98 });
        return {
          text,
          pass: configuration.pass,
          runtime: {
            inputWidth: source.plan.inputWidth,
            inputHeight: source.plan.inputHeight,
            scaledWidth: source.plan.scaledWidth,
            scaledHeight: source.plan.scaledHeight,
            maxTilePixels: source.plan.maxTilePixels,
            tiled: source.plan.tiled,
            tileCount: source.plan.tileCount,
            preprocessingMs: Math.round(preprocessingMs),
            recognitionMs: Math.round(recognitionMs),
          },
        };
      }
    }
    throw new OcrProcessingError('recognition_failed');
  } catch (error) {
    if (error instanceof OcrProcessingError) throw error;
    if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
    throw new OcrProcessingError('recognition_failed', undefined, { cause: error });
  } finally {
    options.signal?.removeEventListener('abort', abort);
    source.close();
    await terminateWorker();
  }
}

function structuredLines(blocks: Tesseract.Block[] | null, pageWidth: number, yOffset = 0): OcrLine[] {
  return (blocks ?? []).flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => {
    const words = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const groups: Tesseract.Word[][] = [];
    for (const word of words) {
      const group = groups.at(-1);
      const previous = group?.at(-1);
      if (!group || previous && word.bbox.x0 - previous.bbox.x1 > pageWidth * .12) groups.push([word]);
      else group.push(word);
    }
    return groups.map((group) => ({
      text: group.map((word) => word.text).join(' ').trim(),
      confidence: group.reduce((sum, word) => sum + word.confidence, 0) / group.length,
      bbox: { x0: Math.min(...group.map((word) => word.bbox.x0)), y0: Math.min(...group.map((word) => word.bbox.y0)) + yOffset, x1: Math.max(...group.map((word) => word.bbox.x1)), y1: Math.max(...group.map((word) => word.bbox.y1)) + yOffset },
    }));
  }))).filter((line) => line.text);
}

function mergeTileText(texts: string[]) {
  const merged: string[] = [];
  for (const text of texts) {
    for (const line of text.split('\n').map((value) => value.trim()).filter(Boolean)) {
      if (merged.slice(-10).includes(line)) continue;
      merged.push(line);
    }
  }
  return merged.join('\n');
}

function textInDocumentOrder(lines: OcrLine[], pageWidth: number, fallback: string) {
  if (!lines.length) return fallback.trim();
  const boundary = pageWidth * .5;
  const right = lines.filter((line) => (line.bbox?.x0 ?? 0) >= boundary);
  const left = lines.filter((line) => (line.bbox?.x0 ?? 0) < boundary);
  const byPosition = (a: OcrLine, b: OcrLine) => (a.bbox?.y0 ?? 0) - (b.bbox?.y0 ?? 0) || (a.bbox?.x0 ?? 0) - (b.bbox?.x0 ?? 0);
  if (left.length >= 2 && right.length >= 2) {
    const firstRightTop = Math.min(...right.map((line) => line.bbox?.y0 ?? 0));
    const top = left.filter((line) => (line.bbox?.y1 ?? 0) < firstRightTop).sort(byPosition);
    const leftColumn = left.filter((line) => !top.includes(line)).sort(byPosition);
    return [...top, ...leftColumn, ...right.sort(byPosition)].map((line) => line.text).join('\n');
  }
  return [...lines].sort(byPosition).map((line) => line.text).join('\n');
}

/** Recipe-document OCR with temporary preprocessing and evidence-based fallback passes. */
export async function recogniseRecipeDocument(image: File | Blob | string, options: OcrOptions = {}): Promise<OcrDocumentResult> {
  options.onProgress?.({ status: 'preparing_image', progress: .01 });
  if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
  const loadStartedAt = performance.now();
  const source = await loadOcrSource(image);
  let preprocessingMs = performance.now() - loadStartedAt;
  let tesseract: typeof import('tesseract.js');
  try { tesseract = await import('tesseract.js'); } catch (error) {
    source.close(); throw new OcrProcessingError('worker_failed', undefined, { cause: error });
  }
  const { createWorker, PSM } = tesseract;
  options.onProgress?.({ status: 'preparing_image', progress: .05 });
  if (options.signal?.aborted) { source.close(); throw new OcrProcessingError('cancelled'); }
  let progressBase = .05;
  let progressWeight = .03;
  let progressStatus = 'reading_recipe';
  let worker: Awaited<ReturnType<typeof createWorker>>;
  try {
    worker = await createWorker('eng', undefined, {
      logger: (message) => options.onProgress?.({ status: progressStatus, progress: Math.min(.96, progressBase + message.progress * progressWeight) }),
    });
  } catch (error) {
    source.close(); throw new OcrProcessingError('worker_failed', undefined, { cause: error });
  }
  const abort = () => { void worker.terminate(); };
  options.signal?.addEventListener('abort', abort, { once: true });
  const attempts: OcrDocumentResult[] = [];
  const configurations: Array<{ pass: RecipeOcrPass; variant: OcrImageVariant; psm: Tesseract.PSM; start: number; end: number }> = [
    { pass: 'primary', variant: 'primary', psm: PSM.AUTO, start: .08, end: .62 },
    { pass: 'contrast', variant: 'contrast', psm: PSM.SINGLE_BLOCK, start: .62, end: .81 },
    { pass: 'threshold', variant: 'threshold', psm: PSM.SPARSE_TEXT, start: .81, end: .96 },
  ];
  let recognitionMs = 0;
  try {
    for (const configuration of configurations) {
      if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
      progressStatus = configuration.pass === 'primary' ? 'reading_recipe' : 'checking_text';
      options.onProgress?.({ status: progressStatus, progress: configuration.start });
      await yieldToBrowser();
      await worker.setParameters({ tessedit_pageseg_mode: configuration.psm, preserve_interword_spaces: '1', user_defined_dpi: '300' });
      const tileTexts: string[] = [];
      const lines: OcrLine[] = [];
      const confidences: number[] = [];
      for (const tile of source.tiles) {
        if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
        await yieldToBrowser();
        const prepStart = performance.now();
        const prepared = prepareOcrVariant(source, configuration.variant, tile);
        preprocessingMs += performance.now() - prepStart;
        const passSpan = configuration.end - configuration.start;
        progressBase = configuration.start + passSpan * tile.index / source.tiles.length;
        progressWeight = passSpan / source.tiles.length;
        try {
          const recognitionStart = performance.now();
          const result = await worker.recognize(prepared.canvas, {}, { text: true, blocks: true });
          recognitionMs += performance.now() - recognitionStart;
          const tileLines = structuredLines(result.data.blocks, prepared.width, prepared.scaledTop);
          lines.push(...tileLines); confidences.push(result.data.confidence);
          tileTexts.push(textInDocumentOrder(tileLines, prepared.width, result.data.text));
        } catch (error) {
          if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
          throw new OcrProcessingError('recognition_failed', undefined, { cause: error });
        } finally {
          prepared.release();
        }
      }
      const rawText = mergeTileText(tileTexts);
      const meanConfidence = confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0;
      const scored = scoreRecipeDocument(rawText, meanConfidence);
      attempts.push({
        rawText,
        text: scored.text,
        meanConfidence,
        lines,
        qualityScore: scored.qualityScore,
        quality: scored.quality,
        pass: configuration.pass,
        psm: configuration.psm,
        discardedLines: scored.discardedLines,
        runtime: {
          inputWidth: source.plan.inputWidth,
          inputHeight: source.plan.inputHeight,
          scaledWidth: source.plan.scaledWidth,
          scaledHeight: source.plan.scaledHeight,
          maxTilePixels: source.plan.maxTilePixels,
          tiled: source.plan.tiled,
          tileCount: source.plan.tileCount,
          preprocessingMs: Math.round(preprocessingMs),
          recognitionMs: Math.round(recognitionMs),
        },
      });
      if (scored.quality === 'good') break;
    }
    if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
    options.onProgress?.({ status: 'checking_text', progress: .98 });
    return attempts.sort((a, b) => b.qualityScore - a.qualityScore || (b.meanConfidence ?? 0) - (a.meanConfidence ?? 0))[0];
  } catch (error) {
    if (error instanceof OcrProcessingError) throw error;
    if (options.signal?.aborted) throw new OcrProcessingError('cancelled');
    throw new OcrProcessingError('recognition_failed', undefined, { cause: error });
  } finally {
    options.signal?.removeEventListener('abort', abort);
    source.close();
    await worker.terminate().catch(() => undefined);
  }
}
