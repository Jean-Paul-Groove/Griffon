export interface DrawingPath {
  strokeStyle: string
  lineWidth: number
  points: PathPoint[]
  tool: DrawingTool
}
interface PathPoint {
  x: number
  y: number
}
export type DrawingTool = 'pen' | 'eraser'
