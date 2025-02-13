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
import type { Message } from '../../types/Room'

interface ChatMessageProps {
  message: Message
  userId: string
}
const props = defineProps<ChatMessageProps>()

// Computed
const messageClass = computed<string>(() => {
  return props.message.sender.id === props.userId ? 'chat-message isSender' : 'chat-message'
})
</script>

<style lang="scss" scoped>
.chat-message {
  padding: 5px;
  border-radius: 10px;
  background-color: rgba(245, 245, 220, 0.415);
  width: 55%;
  margin-left: auto;
  &.isSender {
    margin-left: 0;
    margin-right: auto;
    background-color: rgba(245, 233, 220, 0.415);
  }
  &_sender {
    font-size: x-small;
  }
  &_content {
    padding-left: 10px;
  }
}
</style>
