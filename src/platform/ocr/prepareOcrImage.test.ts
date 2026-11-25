import { describe, expect, it } from 'vitest';
import { calculateOcrScalePlan, MAX_OCR_HEIGHT, MAX_OCR_PIXELS, MAX_OCR_WIDTH } from './prepareOcrImage';

function expectBounded(width: number, height: number) {
  const plan = calculateOcrScalePlan(width, height);
  expect(plan.scaledWidth).toBeLessThanOrEqual(MAX_OCR_WIDTH);
  expect(plan.tileHeight).toBeLessThanOrEqual(MAX_OCR_HEIGHT);
  expect(plan.maxTilePixels).toBeLessThanOrEqual(MAX_OCR_PIXELS);
  return plan;
}

describe('OCR image scale planning', () => {
  it('uses one safe canvas for a normal recipe image', () => {
    const plan = expectBounded(1200, 1600);
    expect(plan).toMatchObject({ scaledWidth: 1800, scaledHeight: 2400, tiled: false, tileCount: 1 });
  });

  it('does not blindly upscale a 1080 × 5000 screenshot', () => {
    const plan = expectBounded(1080, 5000);
    expect(plan.scaledWidth).toBe(1080);
    expect(plan.scaledHeight).toBe(5000);
    expect(plan.tiled).toBe(true);
    expect(plan.tileCount).toBe(2);
    expect(plan).not.toMatchObject({ scaledWidth: 1800, scaledHeight: 8333 });
  });

  it('tiles an extremely large image without exceeding the allocation budget', () => {
    const plan = expectBounded(4000, 10_000);
    expect(plan.tiled).toBe(true);
    expect(plan.tileCount).toBeGreaterThan(1);
  });

  it.each([
    [800, 1200],
    [1080, 2400],
    [1080, 5000],
    [2000, 3000],
    [3024, 4032],
    [4032, 3024],
  ])('keeps every planned allocation safe for %i × %i', (width, height) => {
    expectBounded(width, height);
  });
});
