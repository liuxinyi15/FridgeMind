import { describe, expect, it } from 'vitest';
import { createSeedData } from './seed';
import { loadAppData, saveAppData } from './repositories';

describe('local-first persistence', () => {
  it('restores profile and inventory state after a repository reload', () => {
    const data = createSeedData();
    data.profile.onboardingComplete = true;
    data.inventory[0].batches[0].physicalStock = 42;
    saveAppData(data);

    const restarted = loadAppData();
    expect(restarted.profile.onboardingComplete).toBe(true);
    expect(restarted.inventory[0].batches[0].physicalStock).toBe(42);
  });
});
