<template>
  <div class="drawing-board">
    <div class="canvas_container" :class="'cursor-' + tool">
      <canvas ref="canvas" class="canvas" />
    </div>
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
import { useSocketStore } from '../../stores'
import debounce from 'debounce'
import { WSE } from 'wse'
// Constants
const EMPTY_PATH: DrawingPath = {
  strokeStyle: 'black',
  lineWidth: 1,
  points: [],
  tool: 'brush',
}

// Stores
const { socket } = useSocketStore()

// TempalteRef
const canvas = useTemplateRef('canvas')

// Refs
const currentPath = ref<DrawingPath>(EMPTY_PATH)
const drawingHistory = ref<DrawingPath[]>([])
const tool = ref<DrawingTool>('brush')
const strokeStyle = ref<string>('black')
const lineWidth = ref<number>(21)
const currentIndex = ref<number>(-1)
// Computeds
const ctx = computed<CanvasRenderingContext2D | null>(() => canvas.value?.getContext('2d') || null)
// Hooks
onMounted(() => {
  canvas.value?.addEventListener('mouseenter', watchForMouseDown)
  canvas.value?.addEventListener('mouseleave', stopWatchMouseDown)
  initCanvas()
})

// Functions
function initCanvas(): void {
  if (!canvas.value || !ctx.value) return
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  ctx.value.lineCap = 'round'
}
function resizeCanvas(): void {
  if (!canvas.value || !ctx.value) return
  const { height, width } = canvas.value.getBoundingClientRect()
  ctx.value.canvas.width = width
  ctx.value.canvas.height = height
  redraw()
}
function watchForMouseDown(): void {
  canvas.value?.addEventListener('mousedown', startDrawingOnMouseDown)
}
function stopWatchMouseDown(): void {
  canvas.value?.removeEventListener('mousedown', startDrawingOnMouseDown)
  stopDraw()
}
function startDrawingOnMouseDown(event: MouseEvent): void {
  event.preventDefault()
  if (!canvas.value || !ctx.value) {
    return
  }
  if (event.button !== 0) {
    return
  }
  const x = event.clientX - canvas.value.offsetLeft
  const y = event.clientY - canvas.value.offsetTop

  currentPath.value.strokeStyle = strokeStyle.value
  currentPath.value.lineWidth = lineWidth.value
  currentPath.value.points = [{ x, y }]
  currentPath.value.tool = tool.value
  // If we moved the index (after undo action) and start drawing again we replace the rest of the history
  if (currentIndex.value !== drawingHistory.value.length - 1) {
    drawingHistory.value = drawingHistory.value.slice(0, currentIndex.value + 1)
  }
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  switch (tool.value) {
    case 'brush':
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

  canvas.value.addEventListener('mousemove', draw)
  canvas.value.addEventListener('mouseup', stopDraw)
}
function draw(event: MouseEvent): void {
  if (!canvas.value || !ctx.value) {
    return
  }
  const x = event.clientX - canvas.value.offsetLeft
  const y = event.clientY - canvas.value.offsetTop

  currentPath.value.points.push({ x, y })

  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  debouncedSendDrawing()
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
  canvas.value?.removeEventListener('mousemove', draw)
  canvas.value?.removeEventListener('mouseup', stopDraw)
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
      case 'brush':
        ctx.value.globalCompositeOperation = 'source-over'
        break
      case 'eraser':
        ctx.value.globalCompositeOperation = 'destination-out'
        break
    }
    ctx.value.beginPath()
    ctx.value.moveTo(path.points[0].x, path.points[0].y)
    for (const point of path.points) {
      ctx.value.lineTo(point.x, point.y)
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
  lineWidth.value = size
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
      if (socket !== null) {
        socket.emit(WSE.UPLOAD_DRAWING, { drawing: blob })
      }
    }, 'image/webp')
  }
}
const debouncedSendDrawing = debounce(sendDrawing, 6, { immediate: true })
</script>

<style lang="scss" scoped>
.drawing-board {
  width: 100%;
}
.canvas {
  border-image-source: url('../../assets/background/runes-4.png');
  border-image-repeat: repeat;
  border-image-slice: 200;
  border-image-outset: -10px;
  border-width: 20px;
  width: 100%;
  height: 400px;
  border-style: solid;
  &_container {
    width: 100%;
    height: fit-content;
    padding: 5px;
  }
}
.cursor {
  &-eraser {
    cursor:
      url('../../assets/icons/eraser.png') 0 30,
      auto;
  }
  &-brush {
    cursor:
      url('../../assets/icons/brush.png') 0 30,
      auto;
  }
}
</style>
