<template>
  <div v-if="user !== null" ref="thread" class="chat_thread">
    <ChatMessage
      v-for="message in sortedMessages"
      :key="'message-' + message.id"
      :message="message"
      :player-id="user.id"
    />
  </div>
  <form v-if="!isArtist" class="chat_form" @submit="send">
    <textarea
      id="chat-message"
      v-model="chatMessage"
      class="chat_form_textarea"
      name="chat-message"
      @keydown="sendOnEnter"
    ></textarea>
    <button class="chat_form_submit" title="Envoyer" aria-label="Envoyer le message">
      <FontAwesomeIcon icon="envelope" />
    </button>
  </form>
  <p v-else class="chat_thread_mute">Vous ne pouvez pas envoyer de message en tant qu'artiste</p>
</template>

<script setup lang="ts">
import { ChatMessageDto, MessageDto } from 'shared'
import ChatMessage from './ChatMessage.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore, useSocketStore } from '../../stores'

const props = defineProps<{
  chatMessages: ChatMessageDto[] | MessageDto[]
  sendMessage: (text: string) => void
}>()

const chatMessage = ref<string>('')
// Stores
const { user } = storeToRefs(useAuthStore())
const { isArtist } = storeToRefs(useSocketStore())
// Refs
const thread = useTemplateRef('thread')

// Computeds
const sortedMessages = computed<Array<ChatMessageDto & { seen?: boolean }>>(() => {
  return [...props.chatMessages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  )
})
// Watchers
watch(
  () => props.chatMessages,
  async () => {
    await nextTick()
    if (!thread.value) return
    thread.value.scrollTop = thread.value?.scrollHeight
  },
  { immediate: true, deep: true },
)

// Functions
function sendOnEnter(e: KeyboardEvent): void {
  if (e.key !== 'Enter') {
    return
  }
  if (e.shiftKey) {
    return
  }
  send(e)
}
function send(e: Event | KeyboardEvent): void {
  e.preventDefault()
  props.sendMessage(chatMessage.value)
  chatMessage.value = ''
}
</script>

<style lang="scss" scoped>
.chat {
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
    height: 100%;
    &_mute {
      padding: 0.2rem;
      border-radius: 0.4rem;
      text-align: center;
      background-color: rgba(51, 51, 51, 0.678);
      color: $second-color;
      width: 100%;
      margin: auto;
    }
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
        outline: ridge 0.1rem $main-color;
      }
    }
    &_submit {
      padding: 0.2rem 0.6rem;
      font-size: large;
      border-top-right-radius: 0.4rem;
      border-bottom-right-radius: 0.4rem;
    }
  }
}
</style>
