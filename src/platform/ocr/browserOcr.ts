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
