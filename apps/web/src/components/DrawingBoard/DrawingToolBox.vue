<template>
  <div class="toolbox">
    <ColorPicker @selected-color="selectColor" />
    <div class="toolbox_thickness" @touchend="toggleThickRange">
      <div class="toolbox_thickness_picker" :style="{ display: thickRangeOpen ? 'initial' : '' }">
        <input v-model="lineThickness" type="range" :min="1" :max="61" :step="5" />
      </div>
      <div
        class="toolbox_thickness_preview_container"
        :style="{ borderColor: tool === 'pen' ? color : '' }"
      >
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
      <a class="toolbox_action toolbox_action_tool" @click="setTool('pen')">
        <img :src="pen" alt="pen" />
      </a>
      <a class="toolbox_action toolbox_action_tool" @click="setTool('eraser')">
        <img :src="eraser" alt="eraser" />
      </a>
    </div>
    <div class="toolbox_history">
      <a :disabled="!canUndo" class="toolbox_action" @click="emit('undo')">
        <img class="toolbox_action_svg" :src="undo" alt="undo" />
      </a>
      <a :disabled="!canRedo" class="toolbox_action" @click="emit('redo')">
        <img class="toolbox_action_svg" :src="redo" alt="redo" />
      </a>
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
function toggleThickRange(): void {
  thickRangeOpen.value = !thickRangeOpen.value
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
    width: 2rem;
    & img {
      max-width: 100%;
    }
  }
  &_thickness {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 70px;
    height: 70px;
    &:hover &_picker {
      display: initial;
    }
    &_picker {
      display: none;
      position: absolute;
      bottom: -2rem;
      background-color: rgba(255, 255, 255, 0.941);
      padding: 0.2rem;
      border-radius: 0.8rem;
      box-shadow: 0.05rem 0.05rem 0.8rem black;
      z-index: 10;
      input {
        margin: auto;
        cursor: pointer;
      }
    }
    &_preview {
      &_container {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 100%;
        border: 0.1px solid;
        backdrop-filter: brightness(95%);
        width: 61px;
        height: 61px;
      }
    }
  }
  &_action {
    background: none;
    border: none;
    cursor: pointer;
    transform: scale(0.99);
    &:hover {
      transform: scale(1.1);
      -webkit-text-stroke-color: var(--main-color);
    }
    &:disabled {
      opacity: 0.2;
    }
    &_svg {
      width: 2rem;
      :hover {
        stroke: var(--main-color);
        fill: var(--main-color);
      }
    }
  }
}
</style>
