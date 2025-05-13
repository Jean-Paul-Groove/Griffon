<template>
  <ChatThread :messages="sortedMessages" />
</template>

<script setup lang="ts">
import axios from 'axios'
import { MessageDto, NewMessageDto, WSE, type PlayerInfoDto } from 'shared'
import { computed, onMounted, ref, watch } from 'vue'
import { apiUrl } from '../../helpers'
import { storeToRefs } from 'pinia'
import { useSocketStore } from '../../stores'

const props = defineProps<{ contact: PlayerInfoDto }>()
// Stores
const { socket } = storeToRefs(useSocketStore())

// Refs
const messages = ref<MessageDto[]>([])

// Refs
const sortedMessages = computed<MessageDto[]>(() => {
  return [...messages.value].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
})

// Watchers
watch(
  () => props.contact,
  () => void fetchLastMessages(),
)

// Hooks
onMounted(() => {
  listenToNewMessages()
})

// Function
async function fetchLastMessages(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/messages?contact=' + props.contact.id)
    if (response.data) {
      messages.value = response.data
    }
  } catch (error) {
    console.log(error)
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
  if (data.message) {
    if (data.message.receiver !== props.contact.id && data.message.sender !== props.contact.id) {
      return
    }
    if (messages.value.findIndex((message) => message.id === data.message.id) === -1) {
      messages.value.push(data.message)
    }
  }
}
</script>

<style scoped></style>
