import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardStats } from '@/shared/utils/dashboard-stats';

// Provide mocks for the dependencies
vi.mock('@/shared/config/auth', () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { createServerSupabaseClient } from '@/shared/config/auth';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();

describe('Dashboard Stats Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const sharedResults: Record<string, number> = {};

    (createServerSupabaseClient as any).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (!sharedResults[table]) sharedResults[table] = 0;

        const createChain = (resolveValue: any) => {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            in: vi.fn(() => chain),
            order: vi.fn(() => chain),
            single: vi.fn(() => chain),
            then: (onFullfilled: any) => Promise.resolve(resolveValue).then(onFullfilled),
          };
          return chain;
        };

        const createMultiChain = (results: any[]) => {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            in: vi.fn(() => chain),
            order: vi.fn(() => chain),
            single: vi.fn(() => chain),
            then: (onFullfilled: any) => {
              const res = results[sharedResults[table]] || { data: [], error: null };
              sharedResults[table]++;
              return Promise.resolve(res).then(onFullfilled);
            },
          };
          return chain;
        };

        switch (table) {
          case 'students':
            return createChain({ count: 15 });
          case 'payments':
            return createMultiChain([
              { count: 20 }, // total payments
              { count: 18 }, // completed payments
              {
                data: [
                  { status: 'completed', amount_to_pay: 1000 },
                  { status: 'completed', amount_to_pay: 1000 },
                  { status: 'partially_paid', amount_paid: 500 }
                ]
              }
            ]);
          case 'rooms':
            return createChain({
              data: [
                { total_beds: 4, available_beds: ['bed1', 'bed2'] },
                { total_beds: 4, available_beds: [] }
              ]
            });
          case 'student_reports':
            return createChain({ count: 2 });
          case 'inventory_items':
            return createChain({ count: 5 });
          case 'staff_daily_logs':
            return createChain({ count: 3 });
          default:
            return createChain({ data: [], error: null });
        }
      }),
    });
  });

  it('calculates total revenue correctly', async () => {
    const stats = await getDashboardStats();
    // 1000 + 1000 + 500
    expect(stats.totalRevenue).toBe(2500);
  });

  it('calculates occupancy rate correctly', async () => {
    const stats = await getDashboardStats();
    
    // 2 rooms * 4 beds = 8 total beds
    // available = 2 + 0 = 2
    // occupied = 8 - 2 = 6
    // rate = 6/8 = 75%
    expect(stats.totalBeds).toBe(8);
    expect(stats.occupiedBeds).toBe(6);
    expect(stats.occupancyRate).toBe(75);
  });

  it('fetches new module stats accurately', async () => {
    const stats = await getDashboardStats();
    
    expect(stats.unresolvedReports).toBe(2);
    expect(stats.itemsNeedingRepair).toBe(5);
    expect(stats.pendingLogs).toBe(3);
  });
});
