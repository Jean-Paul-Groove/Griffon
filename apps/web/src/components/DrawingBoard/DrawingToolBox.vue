<template>
  <div class="toolbox">
    <ColorPicker @selected-color="selectColor" />
    <div
      class="toolbox_thickness"
      @mouseenter="toggleThickRange(true)"
      @mouseleave="toggleThickRange(false)"
    >
      <div v-if="thickRangeOpen" class="toolbox_thickness_picker">
        <input v-model="lineThickness" type="range" :min="1" :max="61" :step="10" />
      </div>
      <div class="toolbox_thickness_preview_container">
        <div
          class="toolbox_thickness_preview"
          :style="{
            borderRadius: '100%',
            border: tool === 'eraser' ? '0.01rem solid' : 'none',
            backgroundColor: tool === 'pen' ? color : '',
            width: lineThickness + 'px',
            height: lineThickness + 'px',
          }"
        />
      </div>
    </div>
    <div class="toolbox_tools">
      <button class="toolbox_action toolbox_action_tool" @click="setTool('pen')">
        <img :src="pen" alt="pen" />
      </button>
      <button class="toolbox_action toolbox_action_tool" @click="setTool('eraser')">
        <img :src="eraser" alt="eraser" />
      </button>
    </div>
    <div class="toolbox_history">
      <button :disabled="!canUndo" class="toolbox_action" @click="emit('undo')">
        <img class="toolbox_action_svg" :src="undo" alt="undo" />
      </button>
      <button :disabled="!canRedo" class="toolbox_action" @click="emit('redo')">
        <img class="toolbox_action_svg" :src="redo" alt="redo" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import type { DrawingTool } from './types'
import eraser from '../../assets/icons/eraser.png'
import pen from '../../assets/icons/pen.png'
import undo from '../../assets/svg/undo.svg'
import redo from '../../assets/svg/redo.svg'
// Props
interface DrawingToolBoxProps {
  color: string
  thickness: number
  tool: DrawingTool
  canUndo: boolean
  canRedo: boolean
}
const props = defineProps<DrawingToolBoxProps>()
// Emits
const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'change:color', color: string): void
  (e: 'change:size', size: number): void
  (e: 'change:tool', tool: DrawingTool): void
}>()

// Refs
const color = ref<string>(props.color)
const lineThickness = ref<number>(props.thickness)
const thickRangeOpen = ref<boolean>(false)
const tool = ref<DrawingTool>(props.tool)
// Watchers
watch(
  () => color.value,
  () => {
    emit('change:color', color.value)
  },
)
watch(
  () => lineThickness.value,
  () => {
    emit('change:size', lineThickness.value)
  },
)
watch(
  () => tool.value,
  (newTool, formerTool) => {
    if (newTool !== formerTool) {
      emit('change:tool', newTool)
    }
  },
)
// Functions
function selectColor(newColor: string): void {
  color.value = newColor
  tool.value = 'pen'
}
function toggleThickRange(bool: boolean): void {
  thickRangeOpen.value = bool
}
function setTool(newTool: DrawingTool): void {
  tool.value = newTool
}
</script>

<style lang="scss" scoped>
.toolbox {
  display: flex;
  align-items: center;
  height: fit-content;
  width: 100%;
  justify-content: center;
  gap: 0.2rem;
  &_tools {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  &_thickness {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 70px;
    height: 70px;
    &_picker {
      position: absolute;
      bottom: -15px;
      background-color: rgba(255, 255, 255, 0.805);
      padding: 0.2rem;
      border-radius: 0.8rem;
      box-shadow: 0.05rem 0.05rem 0.8rem black;
      input {
        margin: auto;
        cursor: pointer;
        color: red;
      }
    }
    &_preview {
      &_container {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 100%;
        border: 0.1px solid;
        background-color: rgba(195, 195, 195, 0.358);
        width: 61px;
        height: 61px;
      }
    }
  }
  &_action {
    background: none;
    border: none;
    cursor: pointer;
    &:disabled {
      opacity: 0.2;
    }
    &_svg {
      width: 2rem;
    }
  }
}
</style>
