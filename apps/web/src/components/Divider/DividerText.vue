<template>
  <div class="divider">
    <div :style="{ borderColor: color }" class="divider_separator"></div>
    <div :style="{ color: textColor }" class="divider_text">{{ text }}</div>
    <div :style="{ borderColor: color }" class="divider_separator"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ color?: string; textColor?: string; text: string }>(), {
  color: 'black',
  textColor: 'black',
})
</script>

<style scoped lang="scss">
.divider {
  align-items: center;
  display: flex;
  width: 100%;
  &_separator {
    flex: 1;
    border-top: 1px solid black;
  }
  &_text {
    margin: 0 0.3rem;
  }
}
</style>
