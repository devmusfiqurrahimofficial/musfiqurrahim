import type { ComponentType } from 'react'

export type WindowId = 'about' | 'projects' | 'terminal' | 'skills' | 'contact'

export interface WindowRect {
  x: number
  y: number
  w: number
  h: number
}

export interface WindowEntity extends WindowRect {
  id: WindowId
  open: boolean
  minimized: boolean
  maximized: boolean
  z: number
}

export interface AppDefinition {
  id: WindowId
  title: string
  w: number
  h: number
  icon: ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>
  gradient: string
  Component: ComponentType
}
