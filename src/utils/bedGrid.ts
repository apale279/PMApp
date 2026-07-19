import type { BedLayout } from '../types'
import {
  BED_DEFAULT_HEIGHT,
  BED_DEFAULT_WIDTH,
  BED_GAP,
  GRID_CELL_SIZE,
} from '../types'

export function snapToGrid(value: number, gridSize = GRID_CELL_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

export function snapSizeToGrid(size: number, gridSize = GRID_CELL_SIZE): number {
  return Math.max(gridSize, Math.ceil(size / gridSize) * gridSize)
}

export function getBedDisplaySize(bed: BedLayout): { width: number; height: number } {
  return {
    width: snapSizeToGrid(Math.max(bed.width, BED_DEFAULT_WIDTH)),
    height: snapSizeToGrid(Math.max(bed.height, BED_DEFAULT_HEIGHT)),
  }
}

export function clampBedPosition(
  x: number,
  y: number,
  bedWidth: number,
  bedHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const maxX = Math.max(
    0,
    Math.floor((canvasWidth - bedWidth) / GRID_CELL_SIZE) * GRID_CELL_SIZE,
  )
  const maxY = Math.max(
    0,
    Math.floor((canvasHeight - bedHeight) / GRID_CELL_SIZE) * GRID_CELL_SIZE,
  )

  return {
    x: Math.max(0, Math.min(maxX, snapToGrid(x))),
    y: Math.max(0, Math.min(maxY, snapToGrid(y))),
  }
}

export function normalizeBedOnGrid(bed: BedLayout, canvasWidth: number, canvasHeight: number): BedLayout {
  const { width, height } = getBedDisplaySize(bed)
  const { x, y } = clampBedPosition(bed.x, bed.y, width, height, canvasWidth, canvasHeight)

  return {
    ...bed,
    x,
    y,
    width,
    height,
  }
}

export function normalizeBedsOnGrid(
  beds: BedLayout[],
  canvasWidth: number,
  canvasHeight: number,
): BedLayout[] {
  return beds.map((bed) => normalizeBedOnGrid(bed, canvasWidth, canvasHeight))
}

export function getDefaultCanvasSize(bedCount: number): { width: number; height: number } {
  const cols = Math.ceil(Math.sqrt(Math.max(bedCount, 1)))
  const rows = Math.ceil(Math.max(bedCount, 1) / cols)
  const width =
    GRID_CELL_SIZE * 2 + cols * BED_DEFAULT_WIDTH + (cols - 1) * BED_GAP
  const height =
    GRID_CELL_SIZE * 2 + rows * BED_DEFAULT_HEIGHT + (rows - 1) * BED_GAP

  return {
    width: snapSizeToGrid(width),
    height: snapSizeToGrid(height),
  }
}

export function createGridBedPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total))
  const col = index % cols
  const row = Math.floor(index / cols)

  return {
    x: GRID_CELL_SIZE + col * (BED_DEFAULT_WIDTH + BED_GAP),
    y: GRID_CELL_SIZE + row * (BED_DEFAULT_HEIGHT + BED_GAP),
  }
}

export function getCanvasSizeForBeds(
  beds: BedLayout[],
  options?: { minHeight?: number },
): { width: number; height: number } {
  if (beds.length === 0) return getDefaultCanvasSize(1)

  let maxX = GRID_CELL_SIZE
  let maxY = GRID_CELL_SIZE

  beds.forEach((bed) => {
    const { width, height } = getBedDisplaySize(bed)
    maxX = Math.max(maxX, bed.x + width + GRID_CELL_SIZE)
    maxY = Math.max(maxY, bed.y + height + GRID_CELL_SIZE)
  })

  const contentHeight = snapSizeToGrid(maxY)
  const minHeight = options?.minHeight ?? 0

  return {
    width: snapSizeToGrid(maxX),
    height: snapSizeToGrid(Math.max(contentHeight, minHeight)),
  }
}
