/**
 * Round of 64 bracket slot pairing (within a region):
 * 1 vs 16, 8 vs 9, 5 vs 12, 4 vs 13, 6 vs 11, 3 vs 14, 7 vs 10, 2 vs 15
 * Games 1–8 with bracket_slot 1–8
 */
export const R64_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

/**
 * Which R64 game slots feed into which R32 slot (top vs bottom):
 * R32 game 1: R64 game 1 winner (top) vs R64 game 2 winner (bottom)
 * R32 game 2: R64 game 3 winner (top) vs R64 game 4 winner (bottom)
 * etc.
 */
export function getR32SlotFromR64Game(r64BracketSlot: number): { slot: number; isTop: boolean } {
  const r32Slot = Math.ceil(r64BracketSlot / 2);
  const isTop = r64BracketSlot % 2 === 1;
  return { slot: r32Slot, isTop };
}

/**
 * Same pattern for R32 → S16, S16 → E8 within a region
 */
export function getNextRoundSlot(currentSlot: number): { slot: number; isTop: boolean } {
  const nextSlot = Math.ceil(currentSlot / 2);
  const isTop = currentSlot % 2 === 1;
  return { slot: nextSlot, isTop };
}

/**
 * Final Four: South vs West (one game), East vs Midwest (other game)
 * Championship: two F4 winners
 */
/** Display order on bracket screen: top to bottom */
export const REGION_ORDER = ['east', 'south', 'west', 'midwest'] as const;
export type RegionKey = (typeof REGION_ORDER)[number];
