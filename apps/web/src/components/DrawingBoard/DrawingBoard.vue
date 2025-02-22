<template>
  <div class="drawing-board">
    <div class="drawing-board_word">
      <p>{{ capitalizeString(wordToDraw) }}</p>
    </div>
    <div ref="canvasContainer" class="canvas_container" :class="'cursor-' + tool"></div>
    <DrawingToolBox
      :color="strokeStyle"
      :thickness="lineWidth"
      :tool="tool"
      :can-redo="currentIndex < drawingHistory.length - 1"
      :can-undo="currentIndex > -1"
      @change:color="selectColor"
      @change:size="setLineSize"
      @change:tool="setTool"
      @undo="undoAction"
      @redo="redoAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import type { DrawingTool, DrawingPath } from './types'
import DrawingToolBox from './DrawingToolBox.vue'
import { useSocketStore } from '@/stores'
import debounce from 'debounce'
import { WSE } from 'wse'
import { storeToRefs } from 'pinia'
import { capitalizeString, resizeCanvas } from '@/helpers'
// Constants
const EMPTY_PATH: DrawingPath = {
  strokeStyle: 'black',
  lineWidth: 1,
  points: [],
  tool: 'pen',
}
// Stores
const socketStore = useSocketStore()

const { setListeners } = socketStore
const { socket, wordToDraw } = storeToRefs(socketStore)

// TempalteRef
const canvasContainer = useTemplateRef<HTMLDivElement>('canvasContainer')

// Refs
const currentPath = ref<DrawingPath>(EMPTY_PATH)
const currentTouches = ref<{ [key: string]: DrawingPath }>({})
const drawingHistory = ref<DrawingPath[]>([])
const tool = ref<DrawingTool>('pen')
const strokeStyle = ref<string>('black')
const lineWidth = ref<number>(11)
const currentIndex = ref<number>(-1)
const canvas = ref<HTMLCanvasElement>()
const previousCanvasSize = ref<{ width: number; height: number } | null>(null)
// Computeds
const ctx = computed<CanvasRenderingContext2D | null>(() => canvas.value?.getContext('2d') || null)
// Hooks
onMounted(() => {
  initCanvas()
  window.addEventListener('resize', () => {
    initCanvas()
  })

  setListeners({ [WSE.STOP_DRAW]: clearCanvas })
})

// Functions
function initCanvas(): void {
  canvas.value = undefined
  document.getElementById('canvas')?.remove()
  const newCanvas = document.createElement('canvas')
  canvas.value = newCanvas
  canvas.value.id = 'canvas'
  canvas.value.classList.add('canvas')
  canvasContainer.value?.append(canvas.value)
  resizeCanvas(canvas.value, canvasContainer.value)

  if (previousCanvasSize.value) {
    const scale = canvas.value.width / previousCanvasSize.value?.width
    for (const path of drawingHistory.value) {
      path.lineWidth = path.lineWidth * scale
    }
  }
  previousCanvasSize.value = { width: canvas.value.width, height: canvas.value.height }
  redraw()
  if (!ctx.value) return
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  ctx.value.lineCap = 'round'
  canvasContainer.value?.addEventListener('mouseenter', watchForMouseDown)
  canvasContainer.value?.addEventListener('mouseleave', stopWatchMouseDown)

  canvasContainer.value?.addEventListener('touchstart', startDrawingOnTouch)
  canvasContainer.value?.addEventListener('touchmove', drawOnTouchMove)
  canvasContainer.value?.addEventListener('touchend', stopDrawOnTouch)
}

function watchForMouseDown(): void {
  canvasContainer.value?.addEventListener('mousedown', startDrawingOnMouseDown)
}
function stopWatchMouseDown(): void {
  canvas.value?.removeEventListener('mousedown', startDrawingOnMouseDown)
  stopDraw()
}
function startDrawingOnMouseDown(event: MouseEvent): void {
  event.preventDefault()
  if (!canvas.value || !ctx.value || !canvasContainer.value) {
    return
  }
  if (event.button !== 0) {
    return
  }
  const { top, left } = canvas.value.getBoundingClientRect()
  const x = event.clientX - left
  const y = event.clientY - top
  const relativeX = x / canvas.value.width
  const relativeY = y / canvas.value.height
  currentPath.value.strokeStyle = strokeStyle.value
  currentPath.value.lineWidth = lineWidth.value
  currentPath.value.points = [{ x: relativeX, y: relativeY }]
  currentPath.value.tool = tool.value
  // If we moved the index (after undo action) and start drawing again we replace the rest of the history
  if (currentIndex.value !== drawingHistory.value.length - 1) {
    drawingHistory.value = drawingHistory.value.slice(0, currentIndex.value + 1)
  }
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  switch (tool.value) {
    case 'pen':
      ctx.value.globalCompositeOperation = 'source-over'
      break
    case 'eraser':
      ctx.value.globalCompositeOperation = 'destination-out'
      break
  }
  ctx.value.beginPath()
  ctx.value.moveTo(x, y)
  ctx.value.lineTo(x, y)
  ctx.value.stroke()

  canvasContainer.value.addEventListener('mousemove', draw)
  canvasContainer.value.addEventListener('mouseup', stopDraw)
}

function draw(event: MouseEvent): void {
  if (!canvas.value || !ctx.value) {
    return
  }
  const { top, left } = canvas.value.getBoundingClientRect()
  const x = event.clientX - left
  const y = event.clientY - top
  const relativeX = x / canvas.value.width
  const relativeY = y / canvas.value.height
  currentPath.value.points.push({ x: relativeX, y: relativeY })
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  debouncedSendDrawing()
}
function startDrawingOnTouch(event: TouchEvent): void {
  event.preventDefault()
  if (!canvas.value || !ctx.value || !canvasContainer.value) {
    return
  }
  const { top, left } = canvas.value.getBoundingClientRect()

  for (const touch of event.changedTouches) {
    const x = touch.pageX - left
    const y = touch.pageY - top
    const relativeX = x / canvas.value.width
    const relativeY = y / canvas.value.height
    currentTouches.value[touch.identifier] = {
      strokeStyle: strokeStyle.value,
      lineWidth: lineWidth.value,
      tool: tool.value,
      points: [{ x: relativeX, y: relativeY }],
    }
    if (currentIndex.value !== drawingHistory.value.length - 1) {
      drawingHistory.value = drawingHistory.value.slice(0, currentIndex.value + 1)
    }
    ctx.value.strokeStyle = strokeStyle.value
    ctx.value.lineWidth = lineWidth.value
    switch (tool.value) {
      case 'pen':
        ctx.value.globalCompositeOperation = 'source-over'
        break
      case 'eraser':
        ctx.value.globalCompositeOperation = 'destination-out'
        break
    }
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }
}
function drawOnTouchMove(event: TouchEvent): void {
  if (!canvas.value || !ctx.value) {
    return
  }
  const { top, left } = canvas.value.getBoundingClientRect()
  for (const touch of event.changedTouches) {
    if (!currentTouches.value[touch.identifier]) {
      continue
    }
    const x = touch.pageX - left
    const y = touch.pageY - top
    const relativeX = x / canvas.value.width
    const relativeY = y / canvas.value.height

    currentTouches.value[touch.identifier].points.push({ x: relativeX, y: relativeY })
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
    debouncedSendDrawing()
  }
}
function stopDraw(): void {
  if (!canvas.value || !ctx.value) return
  ctx.value.closePath()
  if (currentPath.value.points.length > 0) {
    drawingHistory.value = [...drawingHistory.value, { ...currentPath.value }]
    currentIndex.value++
    currentPath.value = EMPTY_PATH
    currentPath.value.points = []
  }
  canvasContainer.value?.removeEventListener('mousemove', draw)
  canvasContainer.value?.removeEventListener('mouseup', stopDraw)
}

function stopDrawOnTouch(event: TouchEvent | MouseEvent): void {
  if (!canvas.value || !ctx.value) return
  if (event.type === 'touchend') {
    for (const touch of (event as TouchEvent).changedTouches) {
      const path = currentTouches.value[touch.identifier]
      if (!path) {
        continue
      }
      if (path.points.length > 0) {
        drawingHistory.value = [...drawingHistory.value, { ...path }]
        currentIndex.value++
        delete currentTouches.value[touch.identifier]
      }
    }
  }

  canvasContainer.value?.removeEventListener('touchmove', drawOnTouchMove)
  canvasContainer.value?.removeEventListener('touchend', stopDrawOnTouch)
}
function redraw(): void {
  if (!canvas.value || !ctx.value) {
    return
  }
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.value.lineCap = 'round'
  if (currentIndex.value < 0) {
    debouncedSendDrawing()
    return
  }
  for (const path of drawingHistory.value) {
    ctx.value.strokeStyle = path.strokeStyle
    ctx.value.lineWidth = path.lineWidth
    switch (path.tool) {
      case 'pen':
        ctx.value.globalCompositeOperation = 'source-over'
        break
      case 'eraser':
        ctx.value.globalCompositeOperation = 'destination-out'
        break
    }
    ctx.value.beginPath()
    ctx.value.moveTo(path.points[0].x * canvas.value.width, path.points[0].y * canvas.value.height)
    for (const point of path.points) {
      ctx.value.lineTo(point.x * canvas.value.width, point.y * canvas.value.height)
    }
    ctx.value.stroke()
    if (drawingHistory.value[currentIndex.value] === path) {
      break
    }
  }
  debouncedSendDrawing()
}
function selectColor(color: string): void {
  strokeStyle.value = color
}
function setLineSize(size: number): void {
  lineWidth.value = +size
}
function setTool(newTool: DrawingTool): void {
  tool.value = newTool
}
function undoAction(): void {
  if (currentIndex.value > -1) {
    currentIndex.value--
  }
  redraw()
}
function redoAction(): void {
  if (currentIndex.value < drawingHistory.value.length - 1) {
    currentIndex.value++
  }
  redraw()
}
function sendDrawing(): void {
  if (canvas.value && socket !== null) {
    canvas.value.toBlob((blob) => {
      if (socket.value !== null) {
        socket.value.emit(WSE.UPLOAD_DRAWING, { drawing: blob })
      }
    }, 'image/webp')
  }
}
function clearCanvas(): void {
  if (!ctx.value || !canvas.value) {
    return
  }
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  drawingHistory.value = []
}
const debouncedSendDrawing = debounce(sendDrawing, 6, { immediate: true })
</script>

<style lang="scss" scoped>
.drawing-board {
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
  align-items: center;
  min-height: 0;
  &_word {
    height: 2rem;
  }
}
.canvas_container {
  box-sizing: border-box;
  overflow: hidden;
  aspect-ratio: 1.4;
  background-color: var(--light-bg);
  box-shadow: var(--inside-shadow);
  max-height: 100%;
  width: 100%;
  max-width: 600px;
}

.cursor {
  &-eraser {
    cursor:
      url('../../assets/icons/eraser.png') 0 20,
      auto;
  }
  &-pen {
    cursor:
      url('../../assets/icons/pen.png') 5 35,
      auto;
  }
}

@media (orientation: portrait) {
  .canvas_container {
    max-height: 100%;
    width: 100%;
  }
}
</style>
