import { describe, expect, it } from 'vitest';
import { createSeedData } from './seed';
import { loadAppData, migrateAppData, saveAppData } from './repositories';

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

  it('migrates older saved inventory without losing food', () => {
    const legacy = createSeedData();
    delete (legacy.inventory[0].batches[0] as Partial<typeof legacy.inventory[0]['batches'][0]>).quantityMode;
    const migrated = migrateAppData({ ...legacy, schemaVersion: undefined });
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.inventory[0].name).toBe('Spinach');
    expect(migrated.inventory[0].batches[0].quantityMode).toBe('exact');
  });
});
