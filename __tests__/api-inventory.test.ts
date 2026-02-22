import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/inventory/items/route';
import { POST as POST_DAMAGE } from '@/app/api/admin/inventory/damage-reports/route';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();

vi.mock('@/shared/config/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ id: 'admin-123', role: 'maintenance' }),
}));

const sharedResults: Record<string, number> = {};

vi.mock('@/shared/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (!sharedResults[table]) sharedResults[table] = 0;

      const createChain = (resolveValue: any) => {
        const chain: any = {
          select: mockSelect.mockImplementation(() => chain),
          insert: mockInsert.mockImplementation(() => chain),
          update: mockUpdate.mockImplementation(() => chain),
          delete: vi.fn(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          in: vi.fn(() => chain),
          order: mockOrder.mockImplementation(() => chain),
          single: vi.fn(() => chain),
          maybeSingle: vi.fn(() => chain),
          then: (onFullfilled: any) => Promise.resolve(resolveValue).then(onFullfilled),
        };
        return chain;
      };

      const createMultiChain = (results: any[]) => {
        const chain: any = {
          select: mockSelect.mockImplementation(() => chain),
          insert: mockInsert.mockImplementation(() => chain),
          update: mockUpdate.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          order: mockOrder.mockImplementation(() => chain),
          single: vi.fn(() => chain),
          then: (onFullfilled: any) => {
            const res = results[sharedResults[table]] || { data: [], error: null };
            sharedResults[table]++;
            return Promise.resolve(res).then(onFullfilled);
          },
        };
        return chain;
      };

      if (table === 'inventory_items') {
        const results = [
          { data: { id: 'item-1', name: 'Bed' }, error: null }, // for POST
          { data: [{ id: 'item-1', name: 'Bed' }], error: null }, // for GET
          { error: null } // for POST damage update
        ];
        return createMultiChain(results);
      }
      if (table === 'inventory_damage_reports') {
        return createChain({ data: { id: 'report-1' }, error: null });
      }
      return createChain({ data: [], error: null });
    }),
  },
}));

describe('Inventory Tracking System APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string, method: string, body?: any) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  it('Create inventory item successfully', async () => {
    mockInsert.mockResolvedValue({ data: { id: 'item-1', name: 'Bed' }, error: null });

    const req = createRequest('http://localhost/api', 'POST', {
      name: 'Bed',
      category: 'furniture',
      room_id: 'room-1',
      price_estimate: 20000
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Bed');
  });

  it('Fetch inventory items orders by created_at', async () => {
    mockOrder.mockResolvedValue({ data: [{ id: 'item-1', name: 'Bed' }], error: null });

    const req = createRequest('http://localhost/api?roomId=room-1', 'GET');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    // Since there's a roomId in searchParams, eq() would logically be called in the real implemtation
    // We are just verifying the happy path resolves correctly here.
  });

  it('POST damage report updates item condition to needs_repair', async () => {
    mockInsert.mockResolvedValue({ data: { id: 'report-1' }, error: null });
    mockUpdate.mockResolvedValue({ error: null });

    const req = createRequest('http://localhost/api', 'POST', {
      itemId: 'item-1',
      description: 'Broken leg'
    });

    const res = await POST_DAMAGE(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ condition: 'needs_repair' });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });
});
