import { describe, it, expect } from 'vitest';
import {
  countSelectableBedspaces,
  getAvailableBedspacesForRoom,
  getRoomsWithAvailableBedspaces,
  TOP_BUNK_WEIGHT_MESSAGE,
} from '@/shared/utils/roomSelectionUtils';

const ALL_4_BEDS = ['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

const emptyRoom = {
  id: 'room-1',
  name: '101',
  block: 'A',
  total_beds: 4,
  bed_type: '4_bed',
  available_beds: ALL_4_BEDS,
};

const student = (id: string, bedspace_label: string) => ({
  id,
  first_name: 'Test',
  last_name: 'Student',
  matric_number: id,
  block: 'A',
  room: '101',
  bedspace_label,
});

describe('getAvailableBedspacesForRoom', () => {
  it('lets a student at or under the limit select every free bed', () => {
    const beds = getAvailableBedspacesForRoom(emptyRoom, [], 60);
    expect(beds).toHaveLength(4);
    expect(countSelectableBedspaces(beds)).toBe(4);
  });

  it('shows top bunks as unavailable with a reason for students over the limit', () => {
    const beds = getAvailableBedspacesForRoom(emptyRoom, [], 75);
    expect(beds).toHaveLength(4);
    expect(countSelectableBedspaces(beds)).toBe(2);

    const tops = beds.filter((bed) => bed.position === 'top');
    expect(tops.every((bed) => !bed.available)).toBe(true);
    expect(tops.every((bed) => bed.weightRestriction === TOP_BUNK_WEIGHT_MESSAGE)).toBe(true);
  });

  it('treats a missing weight as no restriction', () => {
    const beds = getAvailableBedspacesForRoom(emptyRoom, []);
    expect(countSelectableBedspaces(beds)).toBe(4);
  });

  it('excludes beds held by students in a partly filled room', () => {
    const room = { ...emptyRoom, available_beds: ['Bed 1 (Top)', 'Bed 2 (Top)', 'Bed 2 (Down)'] };
    const beds = getAvailableBedspacesForRoom(room, [student('s1', 'Bed 1 (Down)')], 50);
    expect(beds.map((bed) => bed.id)).toEqual(['Bunk A-top', 'Bunk B-top', 'Bunk B-bottom']);
  });
});

describe('getRoomsWithAvailableBedspaces', () => {
  it('hides rooms where only weight-restricted top bunks are free', () => {
    const topsOnly = { ...emptyRoom, available_beds: ['Bed 1 (Top)', 'Bed 2 (Top)'] };
    expect(getRoomsWithAvailableBedspaces([topsOnly], [], 75)).toHaveLength(0);
    expect(getRoomsWithAvailableBedspaces([topsOnly], [], 55)).toHaveLength(1);
  });
});
