<template>
  <div class="game-page">
    <DrawingBoard v-if="canDraw" />
    <DrawingRender v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useSocketStore } from '../stores'
import { WSE } from 'shared'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { DrawingBoard } from '@/components'
import DrawingRender from '../components/DrawingRender/DrawingRender.vue'
// Composables
const socketStore = useSocketStore()
const { socket, room, currentPlayer } = storeToRefs(socketStore)
const $route = useRoute()
const $router = useRouter()

// Computeds
const canDraw = computed<boolean>(() => {
  return currentPlayer.value?.isArtist ?? false
})

watch(
  () => room.value,
  () => {
    if (room.value && room.value.currentGame == null) {
      $router.replace({ name: 'Lobby', params: { roomId: room.value.id } })
    }
  },
)

// Hooks
onMounted(() => {
  const { roomId } = $route.params
  if (!socket.value?.connected) {
    socketStore.handleConnection()
  }
  if (!roomId && !room.value?.id) {
    $router.replace({ name: 'Accueil' })
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
  ._countdown {
    height: 2rem;
  }
}
</style>
