<template>
  <div :class="messageClass">
    <p class="chat-message_sender">
      {{ getUserById(message.sender)?.name }} ∙ {{ new Date(message.sentAt).toLocaleTimeString() }}
    </p>
    <p class="chat-message_content">{{ message.content }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSocketStore } from '@/stores'
import type { ChatMessageDto } from 'shared'

const { SYSTEM_ID, getUserById } = useSocketStore()

interface ChatMessageProps {
  message: ChatMessageDto
  playerId: string
}
const props = defineProps<ChatMessageProps>()

// Computed
const messageClass = computed<string>(() => {
  let newClass = 'chat-message'
  if (props.message.sender === props.playerId) {
    newClass += ' isSender'
  } else if (props.message.id === SYSTEM_ID) {
    newClass += ' isSystem'
  }
  return newClass
})
</script>

<style lang="scss" scoped>
.chat-message {
  padding: 0.2rem;
  border-radius: 0.4rem;
  background-color: rgba(245, 233, 220, 0.784);
  width: 80%;
  margin-right: auto;
  &.isSender {
    margin-right: 0;
    margin-left: auto;
    background-color: rgba(245, 245, 220, 0.747);
  }
  &.isSystem {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    background-color: rgba(220, 245, 228, 0.751);
    width: 100%;
  }
  &_sender {
    font-size: x-small;
  }
  &_content {
    padding-left: 0.3rem;
  }
}
</style>
