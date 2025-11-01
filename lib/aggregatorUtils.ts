import { api } from './api';

/**
 * Utility function to ensure aggregators are updated before loading reports
 * This recalculates aggregators for the given date range to ensure data accuracy
 */
export async function ensureAggregatorsUpdated(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  options?: {
    inventoryId?: string;
    section?: string;
    silent?: boolean; // If true, don't show errors to user
  }
): Promise<void> {
  // If no dates provided, skip (for pages that don't use date ranges)
  if (!startDate || !endDate) {
    return;
  }

  try {
    const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
    const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];

    // Trigger aggregator recalculation (non-blocking, fire and forget)
    // We don't await this to avoid blocking the UI, but we catch errors silently
    api.recalculateAggregators({
      startDate: start,
      endDate: end,
      inventoryId: options?.inventoryId,
      section: options?.section,
    }).catch((error) => {
      if (!options?.silent) {
        console.error('Failed to update aggregators:', error);
      }
      // Fail silently - aggregators will update eventually
    });
  } catch (error) {
    if (!options?.silent) {
      console.error('Error triggering aggregator update:', error);
    }
    // Fail silently - don't block the report loading
  }
}

