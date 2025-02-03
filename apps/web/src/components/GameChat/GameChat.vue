<template>
  <div class="game-chat">
    <p
      v-for="(message, index) of messages"
      :key="'message-' + index"
      :style="{ color: message.user.color }"
    >
      <span>[{{ message.user.username }}]:</span><span>{{ message.content }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSocketStore } from '../../stores'
import { WSE } from 'wse'
// Types
interface Message {
  content: string
  sent_at: number
  user: { id: string; username: string; color: string }
}

// Refs
const messages = ref<Message[]>([])
// Stores
const { socket } = useSocketStore()

//watchers
watch(
  () => socket,
  () => {
    if (socket) {
      socket.on(WSE.INVALID_TOKEN, () => console.log('INVALID TOOOOKEN GAME CHAT'))

      socket.onAny((events, args) => {
        console.log('event', events)
        console.log('args', args)
      })
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.game-chat {
  width: 100%;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.13);
}
</style>
