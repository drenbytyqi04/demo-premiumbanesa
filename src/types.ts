/** [x, y] in the pixel coordinates of the source image (same as the SVG viewBox). */
export type Point = [number, number]

export type ApartmentStatus = 'available' | 'sold' | 'reserved'

export interface ImageRef {
  /** path relative to /public, e.g. "images/aerial.jpg" */
  image: string
  width: number
  height: number
}

export interface Complex {
  name: string
  tagline: string
  location: string
  aerial: ImageRef
}

export interface Facade extends ImageRef {
  id: string
  label: string
}

export interface Building {
  id: string
  name: string
  description: string
  floors: number
  /** polygon on the aerial image */
  polygon: Point[] | null
  facades: Facade[]
}

export interface Apartment {
  id: string
  buildingId: string
  floor: number
  number: string
  area: number
  rooms: number
  /** total price in EUR */
  price: number
  status: ApartmentStatus
  /** which facade image the polygon belongs to */
  facadeId: string | null
  /** polygon on the facade image */
  polygon: Point[] | null
  panoramaSceneIds: string[]
  floorPlan: string
}

export interface SceneHotspot {
  pitch: number
  yaw: number
  target: string
}

export interface PanoramaScene {
  id: string
  title: string
  image: string
  initialYaw?: number
  hotSpots: SceneHotspot[]
}

/** Format the polygon editor exports and imports. */
export interface PolygonExport {
  version: 1
  /** what the polygons describe: the aerial image or a facade */
  target: { type: 'aerial' } | { type: 'facade'; buildingId: string; facadeId: string } | { type: 'custom' }
  image: string
  width: number
  height: number
  polygons: { id: string; points: Point[] }[]
}
