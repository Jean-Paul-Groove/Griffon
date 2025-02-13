<template>
  <div>
    <h1>Lobby</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'wse'
import { useRoute, useRouter } from 'vue-router'

// Stores
const socketStore = useSocketStore()
const { handleConnection } = socketStore
const { socket, room } = storeToRefs(socketStore)

// Composables
const $route = useRoute()
const $router = useRouter()
// Refs

// Hooks
onMounted(() => {
  const { roomId } = $route.params
  if (!socket.value?.connected) {
    handleConnection()
  }
  if (!roomId && !room.value?.id) {
    $router.push({ name: 'Landing' })
  } else {
    if (roomId && roomId != room.value?.id && socket.value)
      socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
})
</script>

<style scoped></style>
