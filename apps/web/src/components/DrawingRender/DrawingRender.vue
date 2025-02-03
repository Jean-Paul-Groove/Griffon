<template>
  <div class="drawing-render">
    <p v-if="artist.trim() != ''">{{ artist }}</p>
    <img class="drawing-render_img" :src="image" alt="drawing" base64 />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSocketStore } from '../../stores'
import { WSE } from 'wse'

// Stores
const { socket } = useSocketStore()

// Refs
const image = ref<string>('')
const artist = ref<string>('')
// Watchers
watch(
  () => socket,
  () => {
    console.log('bababa')
    if (socket != null) {
      socket.on(WSE.UPLOAD_DRAWING, (body) => {
        try {
          artist.value = body?.user?.name
          const buffer = body.drawing
          if (buffer instanceof ArrayBuffer) {
            const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)))
            image.value = 'data:image/jpeg;base64,' + base64String
          }

          console.log(image.value)
          console.log(body)
        } catch (error) {
          console.error(error)
        }
      })
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.drawing-render {
  width: 100%;
  height: 100%;
  &_img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}
</style>
