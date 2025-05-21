<template>
  <section class="conversations">
    <h3>Conversations</h3>
    <ul class="conversations_list">
      <li v-if="conversations.length === 0" class="conversations_none">
        Vous n'avez aucune conversation en cours pour le moment ...
      </li>
      <template v-else>
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
              :friend="getConversationContact(conversation) as FriendWithStatus"
              :with-actions="false"
            >
              <ChatMessage :message="conversation" />
            </FriendCard>
          </a>
        </li>
      </template>
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
import { useToast } from '../../composables/useToast'
const emit = defineEmits<{ (e: 'conversation', friend: PlayerInfoDto): void }>()
// Types
type FriendWithStatus = Omit<PlayerInfoDto, 'isArtist'> & {
  online: boolean
}

// Stores
const { user } = storeToRefs(useAuthStore())
const { friends } = storeToRefs(useSocketStore())

// Composables
const $toast = useToast()

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
      withCredentials: true,
    })
    if (response.data) {
      conversations.value = response.data
    }
  } catch {
    $toast.error("Nous n'avons pas pu récupérer vos conversations...")
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
  width: 100%;
  max-width: 600px;
  height: 100%;
  flex-direction: column;
  align-items: center;
  &_none {
    width: 100%;
    max-width: 600px;
  }
  &_list {
    @include white-card;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    max-height: 100%;
    overflow-y: auto;
    &_item {
      width: 100%;
      &_friend-card {
        width: 100%;
        text-wrap: wrap;
        text-overflow: ellipsis;
        overflow: hidden;
        &:hover {
          box-shadow: none;
        }
      }
      &_link {
        font-size: large;
        cursor: pointer;
        width: 100%;
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
      }
    }
  }
}
</style>
