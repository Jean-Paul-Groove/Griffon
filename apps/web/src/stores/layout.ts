import { computed, onMounted, onUnmounted, ref } from 'vue'
import { defineStore } from 'pinia'

export const useLayoutSize = defineStore('layout', () => {
  // Composables
  const windowWidth = ref(window.innerWidth)
  const breakPoint = computed<'laptop' | 'tablet' | 'mobile'>(() => {
    if (windowWidth.value < 700) {
      return 'mobile'
    }
    if (windowWidth.value < 1000) {
      return 'tablet'
    }
    return 'laptop'
  })
  function onWidthChange(): void {
    windowWidth.value = window.innerWidth
  }
  onMounted(() => window.addEventListener('resize', onWidthChange))
  onUnmounted(() => window.removeEventListener('resize', onWidthChange))

  return { breakPoint, windowWidth }
})
