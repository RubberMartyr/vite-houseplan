import type { XZ } from '../../types'

export interface DerivedRoof {
  id: string
  type: 'flat' | 'gable'
  triangles: {
    a: [number, number, number]
    b: [number, number, number]
    c: [number, number, number]
  }[]
  kind: string
  baseLevelId: string
  baseLevel: {
    id: string
    elevation: number
    height: number
  }
  footprintOuter: XZ[]
  footprintHoles: XZ[][]
  roofPolygonOuter: XZ[]
  roofPolygonHoles: XZ[][]
  spec: any
}
