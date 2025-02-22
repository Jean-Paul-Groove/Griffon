<template>
  <div v-if="messages && user?.id" class="game-chat">
    <div ref="thread" class="game-chat_thread">
      <ChatMessage
        v-for="(message, index) in messages"
        :key="'message-' + index"
        :message="message"
        :user-id="user.id"
      />
    </div>
    <form class="game-chat_form" @submit="(e) => sendMessage(e)">
      <textarea
        id="chat-message"
        v-model="chatMessage"
        class="game-chat_form_textarea"
        name="chat-message"
        @keydown="sendOnEnter"
      ></textarea>
      <button class="game-chat_form_submit" title="Envoyer">✉️</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useAuthStore, useSocketStore } from '../../stores'
import { WSE } from 'wse'
import { storeToRefs } from 'pinia'
import ChatMessage from './ChatMessage.vue'

// Stores
const socketStore = useSocketStore()
const authStore = useAuthStore()
// Refs
const thread = useTemplateRef('thread')
const chatMessage = ref<string>('')
const { socket, messages } = storeToRefs(socketStore)
const { user } = storeToRefs(authStore)

// Watchers
watch(
  () => messages.value,
  async () => {
    await nextTick()
    if (!thread.value) return
    thread.value.scrollTop = thread.value?.scrollHeight
  },
  { immediate: true, deep: true },
)
// Functions
function sendMessage(e: Event | KeyboardEvent): void {
  e.preventDefault()
  if (chatMessage.value.trim() !== '' && socket.value !== null) {
    socket.value.emit(WSE.NEW_MESSAGE, { message: chatMessage.value })
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
  padding: 0.2rem;
  max-height: 100%;
  min-height: 0;
  &_thread {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.2rem;
    gap: 0.2rem;
    max-height: 100%;
  }
  &_form {
    width: 100%;
    display: flex;
    gap: 0.2rem;
    &_textarea {
      height: 2rem;
      max-width: 100%;
      width: 100%;
      resize: none;
      background-color: rgba(255, 255, 255, 0.386);
      border: none;
      box-shadow: 0 0 0 0.05rem rgba(0, 0, 0, 0.134);
      padding: 0.2rem;
      border-top-left-radius: 0.4rem;
      border-bottom-left-radius: 0.4rem;
      &:focus {
        outline: ridge 0.1rem var(--secondary-color);
      }
    }
    &_submit {
      cursor: pointer;
      padding: 0.2rem 0.6rem;
      font-size: large;
      border: none;
      background-color: var(--main-color);
      border-top-right-radius: 0.4rem;
      border-bottom-right-radius: 0.4rem;
    }
  }
}
</style>
