<template>
  <div v-if="chatMessages !== null && currentPlayer?.id" class="room-chat">
    <ChatThread
      :current-player="currentPlayer"
      :chat-messages="chatMessages"
      :send-message="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from '../../stores'
import { WSE } from 'shared'
import { storeToRefs } from 'pinia'
import ChatThread from '../ChatThread/ChatThread.vue'

// Stores
const socketStore = useSocketStore()
// Refs
const { socket, chatMessages, currentPlayer } = storeToRefs(socketStore)

// Functions
function sendMessage(text: string): void {
  if (text.trim() !== '' && socket.value !== null) {
    socket.value.emit(WSE.NEW_CHAT_MESSAGE, { message: text })
  }
}
</script>

<style lang="scss" scoped>
.room-chat {
  @include chat-container;
}
</style>
