import { scoreRecipeDocument, type OcrDocumentResult, type OcrLine, type RecipeOcrPass } from '../../domain/recipeOcr';
import { prepareOcrImages } from './prepareOcrImage';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrOptions {
  onProgress?: (progress: OcrProgress) => void;
  signal?: AbortSignal;
}

/**
 * Local browser OCR boundary. Tesseract.js and its worker/language assets are
 * loaded only when this function is called; image pixels are not sent to an API.
 */
export async function recogniseImageText(image: File | Blob | string, options: OcrOptions = {}) {
  const { createWorker } = await import('tesseract.js');
  if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
  const worker = await createWorker('eng', undefined, {
    logger: (message) => options.onProgress?.({ status: message.status, progress: message.progress }),
  });
  const abort = () => { void worker.terminate(); };
  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
    const result = await worker.recognize(image);
    if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
    return result.data.text.trim();
  } finally {
    options.signal?.removeEventListener('abort', abort);
    await worker.terminate().catch(() => undefined);
  }
}

function structuredLines(blocks: Tesseract.Block[] | null, pageWidth: number): OcrLine[] {
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
      bbox: { x0: Math.min(...group.map((word) => word.bbox.x0)), y0: Math.min(...group.map((word) => word.bbox.y0)), x1: Math.max(...group.map((word) => word.bbox.x1)), y1: Math.max(...group.map((word) => word.bbox.y1)) },
    }));
  }))).filter((line) => line.text);
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
  const [{ createWorker, PSM }, prepared] = await Promise.all([import('tesseract.js'), prepareOcrImages(image)]);
  if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
  let passOffset = 0;
  let passWeight = .5;
  const worker = await createWorker('eng', undefined, {
    logger: (message) => options.onProgress?.({ status: message.status, progress: Math.min(.98, passOffset + message.progress * passWeight) }),
  });
  const abort = () => { void worker.terminate(); };
  options.signal?.addEventListener('abort', abort, { once: true });
  const attempts: OcrDocumentResult[] = [];
  const configurations: Array<{ pass: RecipeOcrPass; psm: Tesseract.PSM; offset: number; weight: number }> = [
    { pass: 'primary', psm: PSM.AUTO, offset: 0, weight: .5 },
    { pass: 'contrast', psm: PSM.SINGLE_BLOCK, offset: .5, weight: .25 },
    { pass: 'threshold', psm: PSM.SPARSE_TEXT, offset: .75, weight: .25 },
  ];
  try {
    for (let index = 0; index < configurations.length; index += 1) {
      if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
      const configuration = configurations[index];
      passOffset = configuration.offset; passWeight = configuration.weight;
      await worker.setParameters({ tessedit_pageseg_mode: configuration.psm, preserve_interword_spaces: '1', user_defined_dpi: '300' });
      const result = await worker.recognize(prepared[index].canvas, {}, { text: true, blocks: true });
      const lines = structuredLines(result.data.blocks, prepared[index].width);
      const rawText = textInDocumentOrder(lines, prepared[index].width, result.data.text);
      const scored = scoreRecipeDocument(rawText, result.data.confidence);
      attempts.push({
        rawText,
        text: scored.text,
        meanConfidence: result.data.confidence,
        lines,
        qualityScore: scored.qualityScore,
        quality: scored.quality,
        pass: configuration.pass,
        psm: configuration.psm,
        discardedLines: scored.discardedLines,
      });
      if (scored.quality === 'good') break;
    }
    if (options.signal?.aborted) throw new DOMException('OCR cancelled', 'AbortError');
    options.onProgress?.({ status: 'complete', progress: 1 });
    return attempts.sort((a, b) => b.qualityScore - a.qualityScore || (b.meanConfidence ?? 0) - (a.meanConfidence ?? 0))[0];
  } finally {
    options.signal?.removeEventListener('abort', abort);
    prepared.forEach((candidate) => { candidate.canvas.width = 0; candidate.canvas.height = 0; });
    await worker.terminate().catch(() => undefined);
  }
}
