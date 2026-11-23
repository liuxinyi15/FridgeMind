import { describe, expect, it } from 'vitest';
import { createSeedData } from '../../data/seed';
import { InAppNotificationAdapter } from './InAppNotificationAdapter';

describe('notification delivery adapters', () => {
  it('keeps in-app delivery available without OS permission', async () => {
    const adapter = new InAppNotificationAdapter();
    expect(adapter.isAvailable()).toBe(true);
    expect(await adapter.checkPermission()).toBe('granted');
    await expect(adapter.deliver(createSeedData().interventions[0])).resolves.toBeUndefined();
  });
});
