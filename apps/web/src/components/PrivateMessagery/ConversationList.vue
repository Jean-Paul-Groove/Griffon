<template>
  <section class="conversations">
    <h2>Conversations</h2>
    <p v-if="conversations.length === 0">
      Vous n'avez aucune conversation en cours pour le moment ...
    </p>
    <ul v-else class="conversations_list">
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversations_list_item"
      >
        <a
          class="conversations_list_item_link"
          aria-label="Ouvrir la conversation"
          @click="handleOpenConversation(conversation)"
        >
          <FriendCard
            v-if="getConversationContact(conversation)"
            class="conversations_list_item_friend-card"
            :friend="getConversationContact(conversation)"
            :with-actions="false"
          />
          <ChatMessage :message="conversation" />
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiUrl } from '../../helpers'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { useAuthStore, useSocketStore } from '../../stores'
import type { MessageDto, PlayerInfoDto } from 'shared'
import ChatMessage from '../ChatThread/ChatMessage.vue'
import FriendCard from '../FriendList/FriendCard.vue'
const emit = defineEmits<{ (e: 'conversation', friend: PlayerInfoDto): void }>()
// Stores
const { token, user } = storeToRefs(useAuthStore())
const { friends } = storeToRefs(useSocketStore())
// Refs
const conversations = ref<MessageDto[]>([])

// Hooks
onMounted(() => {
  void fetchConversations()
})

// Functions
async function fetchConversations(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/message/conversations', {
      headers: { Authorization: 'bearer ' + token.value },
    })
    if (response.data) {
      conversations.value = response.data
    }
  } catch (err) {
    console.log(err)
  }
}
function getConversationContact(
  conv: MessageDto,
): (PlayerInfoDto & { online: boolean }) | undefined {
  const contactId = conv.sender.id === user.value?.id ? conv.receiver.id : conv.sender.id

  const contact = friends.value.find((f) => f.id === contactId)
  return contact
}
function handleOpenConversation(conversation: MessageDto): void {
  const contact = getConversationContact(conversation)
  if (contact) {
    emit('conversation', contact)
  }
}
</script>

<style scoped lang="scss">
.conversations {
  display: flex;
  height: 100%;
  flex-direction: column;
  width: 100%;
  align-items: center;
  &_list {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    max-height: 100%;
    height: 100%;
    overflow-y: auto;
    &_item {
      width: 100%;
      &_friend-card {
        max-width: 15rem;
        text-wrap: wrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      &_link {
        font-size: large;
        cursor: pointer;
        @include chat-container;
        width: 90%;
        margin: auto;
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
        padding: 0.2rem 0.5rem;
        &:hover {
          box-shadow: $light-shadow;
          transform: scale(1.01);
        }
      }
    }
  }
}
</style>
