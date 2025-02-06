<template>
  <div v-if="messages && user" class="game-chat">
    <div class="game-chat_thread">
      <div
        v-for="(message, index) in messages"
        :key="'message-' + index"
        class="game-chat_thread_message"
        :class="user.id === message.sender.id ? 'isSender' : ''"
      >
        <p class="game-chat_thread_message-sender">
          {{ message.sender.name }} ∙ {{ new Date(message.sent_at).toLocaleTimeString() }}
        </p>
        <p class="game-chat_thread_message-content">{{ message.content }}</p>
      </div>
    </div>
    <form class="game-chat_form" @submit="(e) => sendMessage(e)">
      <textarea
        id="chat-message"
        v-model="chatMessage"
        class="game-chat_form_textarea"
        name="chat-message"
        @keydown="sendOnEnter"
      ></textarea>
      <button class="game-chat_form_submit">Envoyer</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore, useRoomstore, useSocketStore } from '../../stores'
import { WSE } from 'wse'
import { storeToRefs } from 'pinia'
// Stores
const roomStore = useRoomstore()
const socketStore = useSocketStore()
const authStore = useAuthStore()
// Refs
const chatMessage = ref<string>('')
const { messages } = storeToRefs(roomStore)
const { chatSpace } = storeToRefs(socketStore)
const { user } = storeToRefs(authStore)

// Functions
function sendMessage(e: Event | KeyboardEvent): void {
  e.preventDefault()
  if (chatMessage.value.trim() !== '' && chatSpace.value !== null) {
    chatSpace.value.emit(WSE.NEW_MESSAGE, { message: chatMessage.value })
    chatMessage.value = ''
  }
}
function sendOnEnter(e: KeyboardEvent): void {
  if (e.key !== 'Enter') {
    return
  }
  if (e.shiftKey) {
    return
  }
  sendMessage(e)
}
</script>

<style lang="scss" scoped>
.game-chat {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.13);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  max-height: 100%;
  &_thread {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 5px;
    gap: 5px;
    &_message {
      padding: 5px;
      border-radius: 10px;
      background-color: rgba(245, 245, 220, 0.415);
      width: 70%;
      margin-left: auto;
      + .isSender {
        margin-left: 0;
        margin-right: auto;
      }
      &-sender {
        font-size: x-small;
      }
    }
  }
  &_form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    &_textarea {
      height: 100px;
      max-width: 100%;
      width: 100%;
      max-height: 100px;
      resize: none;
      background-color: rgba(255, 255, 255, 0.386);
      border: none;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.134);
      padding: 5px;
      &:focus {
        outline: solid 1px coral;
      }
    }
  }
}
</style>
