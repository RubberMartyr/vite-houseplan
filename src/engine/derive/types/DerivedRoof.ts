import type { XZ } from '../../types'

export interface DerivedRoof {
  id: string
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
