<template>
  <div class="color-picker">
    <button
      v-for="color of colors"
      :key="color"
      class="color-picker_color"
      :style="{ backgroundColor: color }"
      @click="emit('selected-color', color)"
    ></button>
  </div>
</template>

<script setup lang="ts">
//Constants
const colors = [
  '#fcc02e',
  '#f67c01',
  '#e64a19',
  '#d81b43',
  '#8e24aa',
  '#512da7',
  '#1f87e8',
  '#008781',
  '#05a045',
  '#000000',

  '#fed835',
  '#fb8c00',
  '#f5511e',
  '#eb1d4e',
  '#9c28b1',
  '#5d35b0',
  '#2097f3',
  '#029688',
  '#4cb050',
  '#606060',

  '#ffeb3c',
  '#ffa727',
  '#fe5722',
  '#eb4165',
  '#aa47bc',
  '#673bb7',
  '#42a5f6',
  '#26a59a',
  '#83c683',
  '#909090',

  '#fff176',
  '#ffb74e',
  '#ff8a66',
  '#f1627e',
  '#b968c7',
  '#7986cc',
  '#64b5f6',
  '#80cbc4',
  '#a5d6a7',
  '#d9d9d9',

  '#fff59c',
  '#ffcc80',
  '#ffab91',
  '#fb879e',
  '#cf93d9',
  '#9ea8db',
  '#90caf8',
  '#b2dfdc',
  '#c8e6ca',
  'white',
]
// Emits
const emit = defineEmits<{
  (e: 'selected-color', color: string): void
}>()
</script>

<style lang="scss" scoped>
.color-picker {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  width: 200px;
  &_color {
    aspect-ratio: 1;
    border: none;
    transition: all 0.1s linear;
    cursor: pointer;
    &:hover {
      transform: scale(1.5);
    }
  }
}
</style>
