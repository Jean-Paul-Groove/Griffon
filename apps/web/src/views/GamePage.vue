<template>
  <div class="game-page"><DrawingBoard /><GameChat :messages="messages" /></div>
</template>

<script setup lang="ts">
import DrawingBoard from '../components/DrawingBoard/DrawingBoard.vue'
import GameChat from '../components/GameChat/GameChat.vue'
import { onMounted, ref } from 'vue'
import { useSocketStore } from '../stores'
import { WSE } from 'wse'
// Composables
const { socket } = useSocketStore()
// Constants
// Refs
const messages = ref([])
// Hooks
onMounted(() => {
  if (socket) {
    socket.emit(WSE.ASK_JOIN_ROOM, { roomId: 'TEST' })
  }
})
</script>

<style scoped lang="scss">
.game-page {
  display: grid;
  grid-template-columns: (70% 30%);
  gap: 20px;
}
</style>
