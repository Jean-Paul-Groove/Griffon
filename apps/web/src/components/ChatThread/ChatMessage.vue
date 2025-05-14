<template>
  <div :class="messageClass">
    <p class="chat-message_sender">
      {{ message.sender.name }} ∙
      {{ new Date(message.sentAt).toLocaleTimeString('fr-FR', { timeStyle: 'short' }) }}
    </p>
    <p class="chat-message_content">{{ message.content }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore, useSocketStore } from '@/stores'
import type { ChatMessageDto } from 'shared'
import { storeToRefs } from 'pinia'

const { user } = storeToRefs(useAuthStore())
const { SYSTEM } = useSocketStore()

interface ChatMessageProps {
  message: ChatMessageDto
}
const props = defineProps<ChatMessageProps>()

// Computed
const messageClass = computed<string>(() => {
  let newClass = 'chat-message'
  if (props.message.sender.id === user.value?.id) {
    newClass += ' isSender'
  } else if (props.message.sender.id === SYSTEM.id) {
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
    font-size: small;
  }
  &_content {
    padding-left: 0.3rem;
  }
}
</style>
