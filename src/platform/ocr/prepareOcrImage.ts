export type OcrImageVariant = 'primary' | 'contrast' | 'threshold';

export interface PreparedOcrImage {
  variant: OcrImageVariant;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scale: number;
}

type OcrImageSource = File | Blob | string;

async function imageFromSource(source: OcrImageSource) {
  const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    return { image: bitmap as CanvasImageSource, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  return { image: image as CanvasImageSource, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

function canvasFor(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function greyscaleWithContrast(source: HTMLCanvasElement) {
  const canvas = canvasFor(source.width, source.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const histogram = new Uint32Array(256);
  const grey = new Uint8Array(image.data.length / 4);
  for (let pixel = 0; pixel < grey.length; pixel += 1) {
    const offset = pixel * 4;
    const value = Math.round(image.data[offset] * .299 + image.data[offset + 1] * .587 + image.data[offset + 2] * .114);
    grey[pixel] = value; histogram[value] += 1;
  }
  const clip = Math.floor(grey.length * .015);
  let low = 0; let high = 255; let seen = 0;
  while (low < 255 && seen + histogram[low] < clip) { seen += histogram[low]; low += 1; }
  seen = 0;
  while (high > 0 && seen + histogram[high] < clip) { seen += histogram[high]; high -= 1; }
  const range = Math.max(24, high - low);
  for (let pixel = 0; pixel < grey.length; pixel += 1) {
    const value = Math.max(0, Math.min(255, Math.round((grey[pixel] - low) * 255 / range)));
    const offset = pixel * 4;
    image.data[offset] = value; image.data[offset + 1] = value; image.data[offset + 2] = value; image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function otsuThreshold(source: HTMLCanvasElement) {
  const canvas = canvasFor(source.width, source.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const histogram = new Uint32Array(256);
  for (let offset = 0; offset < image.data.length; offset += 4) histogram[image.data[offset]] += 1;
  const total = image.data.length / 4;
  let sum = 0; for (let value = 0; value < 256; value += 1) sum += value * histogram[value];
  let backgroundWeight = 0; let backgroundSum = 0; let maximum = -1; let threshold = 160;
  for (let value = 0; value < 256; value += 1) {
    backgroundWeight += histogram[value];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += value * histogram[value];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > maximum) { maximum = variance; threshold = value; }
  }
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const value = image.data[offset] > threshold ? 255 : 0;
    image.data[offset] = value; image.data[offset + 1] = value; image.data[offset + 2] = value; image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export async function prepareOcrImages(source: OcrImageSource): Promise<PreparedOcrImage[]> {
  const loaded = await imageFromSource(source);
  try {
    const desiredWidth = loaded.width < 1800 ? Math.min(1800, loaded.width * 4) : Math.min(2600, loaded.width);
    const scale = desiredWidth / loaded.width;
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const primary = canvasFor(width, height);
    const context = primary.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#fff'; context.fillRect(0, 0, width, height);
    context.drawImage(loaded.image, 0, 0, width, height);
    const contrast = greyscaleWithContrast(primary);
    const threshold = otsuThreshold(contrast);
    return [
      { variant: 'primary', canvas: primary, width, height, scale },
      { variant: 'contrast', canvas: contrast, width, height, scale },
      { variant: 'threshold', canvas: threshold, width, height, scale },
    ];
  } finally {
    loaded.close();
  }
}
