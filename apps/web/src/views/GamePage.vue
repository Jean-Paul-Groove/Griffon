<template>
  <div>
    <div class="game-page"><DrawingBoard /> <GameChat /></div>
  </div>
</template>

<script setup lang="ts">
import DrawingBoard from '../components/DrawingBoard/DrawingBoard.vue'
import GameChat from '../components/GameChat/GameChat.vue'
import { onMounted } from 'vue'
import { useSocketStore } from '../stores'
import { WSE } from 'wse'
// Composables
const { socket } = useSocketStore()
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
  grid-template-columns: (calc(70% - 20px) 30%);
  gap: 20px;
  padding: 10px;
  max-height: 100%;
  height: 100%;
}
</style>
