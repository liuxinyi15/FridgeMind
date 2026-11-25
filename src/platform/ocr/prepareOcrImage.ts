export type OcrImageVariant = 'primary' | 'contrast' | 'threshold';
export type OcrFailureCode = 'image_too_large' | 'image_decode_failed' | 'preprocessing_failed' | 'worker_failed' | 'cancelled' | 'recognition_failed';

export const MAX_OCR_WIDTH = 1800;
export const MAX_OCR_HEIGHT = 3200;
export const MAX_OCR_PIXELS = 5_500_000;
export const OCR_TILE_OVERLAP = 160;

type OcrImageInput = File | Blob | string;

export class OcrProcessingError extends Error {
  constructor(public readonly code: OcrFailureCode, message?: string, options?: ErrorOptions) {
    super(message ?? code, options); this.name = 'OcrProcessingError';
  }
}

export interface OcrScalePlan {
  inputWidth: number;
  inputHeight: number;
  scaledWidth: number;
  scaledHeight: number;
  scale: number;
  tiled: boolean;
  tileHeight: number;
  tileCount: number;
  maxTilePixels: number;
}

export interface OcrTilePlan { index: number; top: number; height: number; }

export interface LoadedOcrSource {
  image: CanvasImageSource;
  plan: OcrScalePlan;
  tiles: OcrTilePlan[];
  close: () => void;
}

export interface PreparedOcrImage {
  variant: OcrImageVariant;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scaledTop: number;
  pixels: number;
  release: () => void;
}

export function calculateOcrScalePlan(inputWidth: number, inputHeight: number): OcrScalePlan {
  if (!Number.isFinite(inputWidth) || !Number.isFinite(inputHeight) || inputWidth <= 0 || inputHeight <= 0) throw new OcrProcessingError('image_decode_failed');
  const widthScale = MAX_OCR_WIDTH / inputWidth;
  const desiredScale = Math.min(inputWidth < MAX_OCR_WIDTH ? Math.min(4, widthScale) : 1, widthScale);
  const desiredWidth = Math.max(1, Math.floor(inputWidth * desiredScale));
  const desiredHeight = Math.max(1, Math.floor(inputHeight * desiredScale));
  const desiredIsSafe = desiredHeight <= MAX_OCR_HEIGHT && desiredWidth * desiredHeight <= MAX_OCR_PIXELS;

  // If upscaling would make a long document unsafe, retain at most its natural
  // resolution. OCR resolution is recovered with sequential tiles, not a huge canvas.
  const conservativeScale = Math.min(1, widthScale);
  const conservativeWidth = Math.max(1, Math.floor(inputWidth * conservativeScale));
  const conservativeHeight = Math.max(1, Math.floor(inputHeight * conservativeScale));
  const needsTiles = !desiredIsSafe && (conservativeHeight > MAX_OCR_HEIGHT || conservativeWidth * conservativeHeight > MAX_OCR_PIXELS);
  const pixelScale = Math.sqrt(MAX_OCR_PIXELS / (inputWidth * inputHeight));
  const safeWholeScale = Math.min(conservativeScale, MAX_OCR_HEIGHT / inputHeight, pixelScale);
  const scale = desiredIsSafe ? desiredScale : needsTiles ? conservativeScale : safeWholeScale;
  const scaledWidth = Math.max(1, Math.floor(inputWidth * scale));
  const scaledHeight = Math.max(1, Math.floor(inputHeight * scale));
  const tileHeight = needsTiles ? Math.max(1, Math.min(MAX_OCR_HEIGHT, Math.floor(MAX_OCR_PIXELS / scaledWidth))) : scaledHeight;
  const step = Math.max(1, tileHeight - OCR_TILE_OVERLAP);
  const tileCount = needsTiles ? Math.max(1, Math.ceil(Math.max(0, scaledHeight - OCR_TILE_OVERLAP) / step)) : 1;
  const maxTilePixels = scaledWidth * Math.min(tileHeight, scaledHeight);
  if (scaledWidth > MAX_OCR_WIDTH || tileHeight > MAX_OCR_HEIGHT || maxTilePixels > MAX_OCR_PIXELS) throw new OcrProcessingError('image_too_large');
  return { inputWidth, inputHeight, scaledWidth, scaledHeight, scale, tiled: needsTiles, tileHeight, tileCount, maxTilePixels };
}

function tilePlans(plan: OcrScalePlan): OcrTilePlan[] {
  if (!plan.tiled) return [{ index: 0, top: 0, height: plan.scaledHeight }];
  const step = Math.max(1, plan.tileHeight - OCR_TILE_OVERLAP);
  const tiles: OcrTilePlan[] = [];
  for (let top = 0; top < plan.scaledHeight; top += step) {
    const height = Math.min(plan.tileHeight, plan.scaledHeight - top);
    tiles.push({ index: tiles.length, top, height });
    if (top + height >= plan.scaledHeight) break;
  }
  return tiles;
}

async function decodeSource(source: OcrImageInput) {
  try {
    const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
    if ('createImageBitmap' in globalThis) {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return { image: bitmap as CanvasImageSource, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    }
    const url = URL.createObjectURL(blob);
    const image = new Image(); image.decoding = 'async'; image.src = url; await image.decode();
    return { image: image as CanvasImageSource, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    throw new OcrProcessingError('image_decode_failed', undefined, { cause: error });
  }
}

export async function loadOcrSource(source: OcrImageInput): Promise<LoadedOcrSource> {
  const decoded = await decodeSource(source);
  try {
    const plan = calculateOcrScalePlan(decoded.width, decoded.height);
    return { image: decoded.image, plan, tiles: tilePlans(plan), close: decoded.close };
  } catch (error) {
    decoded.close(); throw error;
  }
}

function allocateCanvas(width: number, height: number) {
  const pixels = width * height;
  if (width <= 0 || height <= 0 || width > MAX_OCR_WIDTH || height > MAX_OCR_HEIGHT || pixels > MAX_OCR_PIXELS) throw new OcrProcessingError('image_too_large');
  try {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    if (canvas.width !== width || canvas.height !== height) throw new Error('Canvas allocation mismatch');
    return canvas;
  } catch (error) {
    throw new OcrProcessingError('preprocessing_failed', undefined, { cause: error });
  }
}

function transformPixelsInPlace(context: CanvasRenderingContext2D, width: number, height: number, variant: Exclude<OcrImageVariant, 'primary'>) {
  let image: ImageData;
  try { image = context.getImageData(0, 0, width, height); } catch (error) { throw new OcrProcessingError('preprocessing_failed', undefined, { cause: error }); }
  const histogram = new Uint32Array(256);
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const grey = Math.round(image.data[offset] * .299 + image.data[offset + 1] * .587 + image.data[offset + 2] * .114);
    image.data[offset] = grey; image.data[offset + 1] = grey; image.data[offset + 2] = grey; image.data[offset + 3] = 255; histogram[grey] += 1;
  }
  if (variant === 'contrast') {
    const clip = Math.floor(width * height * .015); let low = 0; let high = 255; let seen = 0;
    while (low < 255 && seen + histogram[low] < clip) { seen += histogram[low]; low += 1; }
    seen = 0; while (high > 0 && seen + histogram[high] < clip) { seen += histogram[high]; high -= 1; }
    const range = Math.max(24, high - low);
    for (let offset = 0; offset < image.data.length; offset += 4) {
      const value = Math.max(0, Math.min(255, Math.round((image.data[offset] - low) * 255 / range)));
      image.data[offset] = value; image.data[offset + 1] = value; image.data[offset + 2] = value;
    }
  } else {
    const total = width * height; let sum = 0; for (let value = 0; value < 256; value += 1) sum += value * histogram[value];
    let backgroundWeight = 0; let backgroundSum = 0; let maximum = -1; let threshold = 160;
    for (let value = 0; value < 256; value += 1) {
      backgroundWeight += histogram[value]; if (!backgroundWeight) continue;
      const foregroundWeight = total - backgroundWeight; if (!foregroundWeight) break;
      backgroundSum += value * histogram[value];
      const variance = backgroundWeight * foregroundWeight * (backgroundSum / backgroundWeight - (sum - backgroundSum) / foregroundWeight) ** 2;
      if (variance > maximum) { maximum = variance; threshold = value; }
    }
    for (let offset = 0; offset < image.data.length; offset += 4) {
      const value = image.data[offset] > threshold ? 255 : 0;
      image.data[offset] = value; image.data[offset + 1] = value; image.data[offset + 2] = value;
    }
  }
  try { context.putImageData(image, 0, 0); } catch (error) { throw new OcrProcessingError('preprocessing_failed', undefined, { cause: error }); }
}

export function prepareOcrVariant(source: LoadedOcrSource, variant: OcrImageVariant, tile: OcrTilePlan): PreparedOcrImage {
  const { plan } = source;
  const canvas = allocateCanvas(plan.scaledWidth, tile.height);
  try {
    const context = canvas.getContext('2d', { willReadFrequently: variant !== 'primary' });
    if (!context) throw new OcrProcessingError('preprocessing_failed');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'; context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    const sourceTop = tile.top / plan.scale;
    const sourceHeight = tile.height / plan.scale;
    context.drawImage(source.image, 0, sourceTop, plan.inputWidth, sourceHeight, 0, 0, plan.scaledWidth, tile.height);
    if (variant !== 'primary') transformPixelsInPlace(context, canvas.width, canvas.height, variant);
    return { variant, canvas, width: canvas.width, height: canvas.height, scaledTop: tile.top, pixels: canvas.width * canvas.height, release: () => { canvas.width = 0; canvas.height = 0; } };
  } catch (error) {
    canvas.width = 0; canvas.height = 0;
    if (error instanceof OcrProcessingError) throw error;
    throw new OcrProcessingError('preprocessing_failed', undefined, { cause: error });
  }
}

export function nextPaint() {
  if (typeof requestAnimationFrame !== 'function') return new Promise<void>((resolve) => setTimeout(resolve, 0));
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function yieldToBrowser() {
  if (typeof requestAnimationFrame !== 'function') return new Promise<void>((resolve) => setTimeout(resolve, 0));
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
