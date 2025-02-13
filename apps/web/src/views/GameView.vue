<template>
  <div class="game-page">
    <h1>GAME</h1>
    <DrawingBoard v-if="user && user.canDraw" />
    <DrawingRender v-else />
  </div>
</template>

<script setup lang="ts">
import DrawingBoard from '../components/DrawingBoard/DrawingBoard.vue'
import { onMounted } from 'vue'
import { useAuthStore, useSocketStore } from '../stores'
import { WSE } from 'wse'
import { storeToRefs } from 'pinia'
import DrawingRender from '../components/DrawingRender/DrawingRender.vue'
import { useRoute, useRouter } from 'vue-router'
// Composables
const socketStore = useSocketStore()
const authStore = useAuthStore()
const { socket, room } = storeToRefs(socketStore)
const { user } = storeToRefs(authStore)
const $route = useRoute()
const $router = useRouter()
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
