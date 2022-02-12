export type coord = {
  x: number,
  y: number
}
const ccw = (A: coord, B: coord, C: coord) =>
  (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);

export const intersect = (A: coord, B: coord, C: coord, D: coord) =>
  ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);