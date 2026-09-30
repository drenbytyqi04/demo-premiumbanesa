declare module 'pannellum/build/pannellum.js'

interface PannellumViewer {
  loadScene(sceneId: string, pitch?: number | 'same', yaw?: number | 'same', hfov?: number | 'same'): void
  getScene(): string
  on(event: string, cb: (...args: unknown[]) => void): void
  off(event?: string, cb?: (...args: unknown[]) => void): void
  destroy(): void
  toggleFullscreen(): void
  resize(): void
}

interface Window {
  pannellum: { viewer(container: HTMLElement | string, config: Record<string, unknown>): PannellumViewer }
}
