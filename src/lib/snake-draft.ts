/**
 * Snake draft: rounds 1,3,5... go 1→8; rounds 2,4,6... go 8→1
 * pick_number 1–64, player draft_position 1–8
 */
export function playerPositionForPick(pickNumber: number): number {
  const round = Math.ceil(pickNumber / 8);
  const positionInRound = ((pickNumber - 1) % 8) + 1;
  return round % 2 === 1 ? positionInRound : 9 - positionInRound;
}

export function currentPickNumberFromCount(completedPickCount: number): number {
  return Math.min(completedPickCount + 1, 64);
}
