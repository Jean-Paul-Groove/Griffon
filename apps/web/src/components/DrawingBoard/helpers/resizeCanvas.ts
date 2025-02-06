export function resizeCanvas(
  canvas: HTMLCanvasElement | null,
  container: HTMLElement | null,
): void {
  if (!canvas || !container) {
    return
  }

  const context = canvas.getContext('2d')
  const { width: newWidth, height: newHeight } = canvas.getBoundingClientRect()
  if (context) {
    canvas.width = newWidth
    canvas.height = newHeight
    context.canvas.width = newWidth
    context.canvas.height = newHeight
  }
}
