<template>
  <section v-if="contact" class="private-messagery">
    <div class="private-messagery_head">
      <h3>Conversation avec {{ contact.name }}</h3>
      <img :src="getImageUrl(contact.avatar)" :alt="contact.name" />
      <ButtonIcon
        class="private-messagery_head_leave"
        icon="xmark"
        text="Quitter"
        :selected="false"
        @click="contact = undefined"
      />
    </div>

    <p v-if="sortedMessages.length === 0">Pas encore de messages ...</p>
    <ChatThread :chat-messages="sortedMessages" :send-message="sendMessage" />
  </section>
  <ConversationList v-else @conversation="(friend) => (contact = friend)" />
</template>

<script setup lang="ts">
import axios from 'axios'
import { MessageDto, NewMessageDto, PlayerInfoDto, WSE } from 'shared'
import { computed, onMounted, ref, watch } from 'vue'
import { apiUrl } from '../../helpers'
import { storeToRefs } from 'pinia'
import { useSocketStore } from '../../stores'
import ChatThread from '../ChatThread/ChatThread.vue'
import ConversationList from './ConversationList.vue'
import ButtonIcon from '../ButtonIcon/ButtonIcon.vue'
import { getImageUrl } from '../../helpers/avatars'
import { useToast } from '../../composables/useToast'

// Stores
const { socket } = storeToRefs(useSocketStore())

// Composables
const $toast = useToast()

// Models
const contact = defineModel<PlayerInfoDto>()

// Refs
const messages = ref<MessageDto[]>([])

// Computeds
const sortedMessages = computed<MessageDto[]>(() => {
  return [...messages.value].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  )
})

// Watchers
watch(
  () => contact.value,
  () => void fetchLastMessages(),
  { immediate: true },
)

// Hooks
onMounted(() => {
  listenToNewMessages()
})

// Function
async function fetchLastMessages(offset: number = 0): Promise<void> {
  try {
    if (!contact.value) {
      return
    }
    const response = await axios.get(
      `${apiUrl}/message/list/${contact.value.id}?offset=${offset}`,
      {
        withCredentials: true,
      },
    )
    if (response.data) {
      messages.value = response.data
    }
  } catch {
    $toast.error('Une erreur est survenue...')
  }
}
function listenToNewMessages(): void {
  if (socket.value) {
    if (!socket.value.listeners(WSE.NEW_PRIVATE_MESSAGE).includes(onNewMessage)) {
      socket.value.on(WSE.NEW_PRIVATE_MESSAGE, onNewMessage)
    }
  }
}
function onNewMessage(data: NewMessageDto['arguments']): void {
  if (!contact.value) {
    return
  }
  if (data.message) {
    if (
      data.message.receiver.id !== contact.value.id &&
      data.message.sender.id !== contact.value.id
    ) {
      return
    }
    if (messages.value.findIndex((message) => message.id === data.message.id) === -1) {
      messages.value.push(data.message)
    }
  }
}
function sendMessage(text: string): void {
  if (text.trim() !== '' && contact.value) {
    if (socket.value) {
      socket.value.emit(WSE.NEW_PRIVATE_MESSAGE, { message: text, receiver: contact.value.id })
    }
  }
}
</script>

<style lang="scss" scoped>
.private-messagery {
  @include chat-container;
  height: 75%;
  &_head {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    height: 3rem;
    width: 100%;
    position: relative;
    & h2 {
      text-align: center;
      max-width: 70%;
    }
    & img {
      @include avatar;
      max-height: 3rem;
      height: 100%;
    }
    &_leave {
      width: fit-content;
      justify-self: end;
      position: absolute;
      right: 0.5rem;
      @include danger-button;
    }
  }
}
</style>
