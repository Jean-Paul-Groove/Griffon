<template>
  <div class="toolbox">
    <ColorPicker @selected-color="selectColor" />
    <div
      class="toolbox_thickness"
      @mouseenter="toggleThickRange(true)"
      @mouseleave="toggleThickRange(false)"
    >
      <div v-if="thickRangeOpen" class="toolbox_thickness_range">
        <input v-model="lineThickness" type="range" :min="1" :max="61" :step="10" />
      </div>
      <div
        class="toolbox_thickness_preview"
        :style="{
          borderRadius: '100%',
          border: '.5px solid',
          backgroundColor: tool === 'brush' ? color : '',
          width: lineThickness + 'px',
          height: lineThickness + 'px',
        }"
      />
    </div>
    <div class="toolbox_tools">
      <button class="toolbox_action toolbox_action_tool" @click="setTool('brush')">
        <img :src="brush" alt="brush" />
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
import brush from '../../assets/icons/brush.png'
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
  tool.value = 'brush'
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
  gap: 5px;
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
    &_range {
      position: absolute;
      top: 70px;
      background-color: white;
      padding: 5px;
      border-radius: 20px;
      box-shadow: 1px 1px 20px black;
      input {
        cursor: pointer;
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
      width: 40px;
    }
  }
}
</style>
