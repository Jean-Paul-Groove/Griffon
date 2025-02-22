<template>
  <div class="game-page">
    <DrawingBoard />
    <!-- <DrawingRender v-else /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSocketStore } from '../stores'
import { WSE } from 'wse'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { DrawingBoard } from '@/components'
// Composables
const socketStore = useSocketStore()
const { socket, room, player } = storeToRefs(socketStore)
const $route = useRoute()
const $router = useRouter()

// Computeds
const canDraw = computed<boolean>(() => {
  return player.value?.isDrawing ?? false
})
// Hooks
onMounted(() => {
  const { roomId } = $route.params
  if (!socket.value?.connected) {
    socketStore.handleConnection()
  }
  if (!roomId && !room.value?.id) {
    $router.push({ name: 'Landing' })
  } else {
    if (roomId && roomId != room.value?.id && socket.value)
      socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
})
</script>
<style scoped lang="scss">
.game-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
