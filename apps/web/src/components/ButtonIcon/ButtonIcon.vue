<template>
  <button class="button-icon" :class="{ selected }">
    <FontAwesomeIcon class="button-icon_icon" :icon="icon" /><span class="button-icon_text">{{
      text
    }}</span>
  </button>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{ icon: string; text?: string; selected: boolean }>()
</script>

<style lang="scss" scoped>
.button-icon {
  color: $main-color;
  background-color: white;
  border: 1px solid $main-color;
  display: flex;
  gap: 0.5rem;
  &:hover {
    box-shadow: none;
    color: white;
    background-color: $main-color;
  }
  &.selected {
    background-color: $main-color;
    color: white;
  }
  &_text {
    @include screen-reader-only;
  }
}
@media screen and (min-width: 700px) {
  .button-icon_text {
    clip: auto;
    clip-path: none;
    height: fit-content;
    position: initial;
    white-space: initial;
    width: fit-content;
  }
}
</style>
