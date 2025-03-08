<template>
  <div class="drawing-render">
    <p v-if="artist.trim() != ''">{{ artist }}</p>
    <div v-if="image" class="drawing-render_contaienr">
      <img class="drawing-render_container_img" :src="image" alt="drawing" base64 />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSocketStore } from '../../stores'
import { UploadDrawingDto, WSE } from 'shared'
import { storeToRefs } from 'pinia'

// Stores
const socketStore = useSocketStore()
const { socket } = storeToRefs(socketStore)

// Refs
const image = ref<string>('')
const artist = ref<string>('')
// Watchers
watch(
  () => socket,
  () => {
    if (socket.value != null) {
      socket.value.on(WSE.UPLOAD_DRAWING, (body: UploadDrawingDto['arguments']) => {
        try {
          artist.value = body.player.name
          const buffer = body.drawing
          if (buffer instanceof ArrayBuffer) {
            const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)))
            image.value = 'data:image/jpeg;base64,' + base64String
          }
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
  max-height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
  align-items: center;
  min-height: 0;
  &_container {
    box-sizing: border-box;
    overflow: hidden;
    aspect-ratio: 1.4;
    background-color: var(--light-bg);
    box-shadow: var(--inside-shadow);
    &_img {
      background-color: var(--light-bg);
      box-shadow: var(--inside-shadow);
      display: block;
      height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
  }
}
</style>
