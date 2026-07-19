import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GRID_CELL_SIZE } from '../types'

interface BedMapCanvasProps {
  width: number
  height: number
  children: ReactNode
}

export function BedMapCanvas({ width, height, children }: BedMapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [displayWidth, setDisplayWidth] = useState(width)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateLayout = () => {
      const available = viewport.clientWidth
      if (available <= 0 || width <= 0) {
        setScale(1)
        setDisplayWidth(width)
        return
      }

      if (available >= width) {
        setScale(1)
        setDisplayWidth(width)
        return
      }

      setScale(available / width)
      setDisplayWidth(width)
    }

    updateLayout()
    const observer = new ResizeObserver(updateLayout)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [width, height])

  const scaledHeight = height * scale

  return (
    <div ref={viewportRef} className="bed-map-viewport">
      <div
        className="bed-map-scaler"
        style={{
          width: displayWidth * scale,
          height: scaledHeight,
        }}
      >
        <div
          className="bed-canvas bed-canvas-workspace"
          style={{
            width: displayWidth,
            height,
            minWidth: displayWidth,
            minHeight: height,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
            ['--grid-size' as string]: `${GRID_CELL_SIZE}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
