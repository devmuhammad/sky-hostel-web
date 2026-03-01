import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/admin/daily-logs/route';
import { PATCH } from '@/app/api/admin/daily-logs/[id]/review/route';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();
const mockUpdateSelect = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/shared/config/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ id: 'admin-123', role: 'supervisor' }),
}));

const sharedResults: Record<string, number> = {};

vi.mock('@/shared/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (!sharedResults[table]) sharedResults[table] = 0;

      const createChain = (resolveValue: any) => {
        const chain: any = {
          select: vi.fn(() => chain),
          insert: vi.fn(() => chain),
          update: vi.fn(() => chain),
          delete: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          order: vi.fn(() => chain),
          single: vi.fn(() => chain),
          maybeSingle: vi.fn(() => chain),
          then: (onFullfilled: any) => Promise.resolve(resolveValue).then(onFullfilled),
        };
        return chain;
      };

      const createMultiChain = (results: any[]) => {
        const chain: any = {
          select: vi.fn(() => chain),
          insert: vi.fn(() => chain),
          update: vi.fn(() => chain),
          eq: vi.fn(() => chain),
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

      if (table === 'staff_daily_logs') {
        const results = [
          { data: { id: 'log-1', shift: 'day' }, error: null }, // for POST
          { data: [{ id: 'log-1', duty_type: 'Cleaning', supervisor_status: 'pending' }], error: null }, // for GET
          { data: { id: 'log-1', supervisor_status: 'approved' }, error: null } // for PATCH update
        ];
        return createMultiChain(results);
      }
      return createChain({ data: [], error: null });
    }),
  },
}));

describe('Staff Daily Logs Integration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string, method: string, body?: any) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  it('Create daily log works and returns valid response', async () => {
    mockInsert.mockResolvedValue({ data: { id: 'log-1', shift: 'morning' }, error: null });

    const req = createRequest('http://localhost/api', 'POST', {
      shift: 'day',
      duty_type: 'Cleaning',
      activities: 'Mopped floors',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.shift).toBe('day');
  });

  it('Fetch daily logs works', async () => {
    mockOrder.mockResolvedValue({ 
      data: [{ id: 'log-1', duty_type: 'Cleaning', supervisor_status: 'pending' }], 
      error: null 
    });

    const req = createRequest('http://localhost/api', 'GET');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
  });

  it('Review daily log updates status', async () => {
    mockUpdateSelect.mockResolvedValue({ data: { id: 'log-1', supervisor_status: 'approved' }, error: null });

    const req = createRequest('http://localhost/api', 'PATCH', {
      supervisor_status: 'approved',
      supervisor_comments: 'Looks good'
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'log-1' }) });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.supervisor_status).toBe('approved');
  });
});
