<template>
  <div :class="messageClass">
    <p class="chat-message_sender">
      {{ message.sender.name }} ∙ {{ new Date(message.sent_at).toLocaleTimeString() }}
    </p>
    <p class="chat-message_content">{{ message.content }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSocketStore } from '@/stores'
import type { Message } from 'dto'

const { SYSTEM_ID } = useSocketStore()

interface ChatMessageProps {
  message: Message
  userId: string
}
const props = defineProps<ChatMessageProps>()

// Computed
const messageClass = computed<string>(() => {
  let newClass = 'chat-message'
  if (props.message.sender.id === props.userId) {
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
  background-color: rgba(245, 245, 220, 0.415);
  width: 80%;
  margin-left: auto;
  &.isSender {
    margin-left: 0;
    margin-right: auto;
    background-color: rgba(245, 233, 220, 0.415);
  }
  &.isSystem {
    margin-left: auto;
    margin-right: auto;
    background-color: rgba(220, 245, 228, 0.415);
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
