<template>
  <div>
    <button v-if="isAdmin" @click="requestGameOfGriffonary">Ask for griffon</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import { useRoute, useRouter } from 'vue-router'

// Stores
const socketStore = useSocketStore()
const { handleConnection } = socketStore
const { socket, room, isAdmin } = storeToRefs(socketStore)
// Composables
const $route = useRoute()
const $router = useRouter()
// Refs

// Hooks
onMounted(() => {
  const { roomId } = $route.params
  console.log('INSIDE LOBBY ON MOUNTED')
  if (!socket.value?.connected) {
    handleConnection()
  }
  if (!roomId && !room.value?.id) {
    console.log('pas de room du tout')
    $router.push({ name: 'Landing' })
  } else {
    if (roomId && roomId != room.value?.id && socket.value)
      socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
})

// Functions
function requestGameOfGriffonary(): void {
  socket.value?.emit(WSE.ASK_START_GAME, { game: 'Griffonary' })
}
</script>

<style scoped></style>
