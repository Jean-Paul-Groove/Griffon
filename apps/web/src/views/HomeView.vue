<template>
  <section class="home">
    <h2 v-if="user" class="home_welcome">Bienvenue {{ user.name }} !</h2>
    <div v-if="user?.role === UserRole.GUEST"></div>
    <div v-else class="home_conbined-view">
      <nav class="home_conbined-view_button-container">
        <ButtonIcon
          icon="dice"
          text="Salon de jeu"
          :selected="view === 'room'"
          @click="view = 'room'"
        />
        <ButtonIcon
          icon="users"
          text="Amis"
          :selected="view === 'friends'"
          @click="view = 'friends'"
        />
        <ButtonIcon
          icon="comment"
          text="Messages"
          :selected="view === 'messages'"
          @click="view = 'messages'"
        />
        <!-- <ButtonIcon
          icon="clock"
          text="Historique"
          :selected="view === 'history'"
          @click="view = 'history'"
        /> -->
        <ButtonIcon
          icon="user-gear"
          text="Profile"
          :selected="view === 'settings'"
          @click="view = 'settings'"
        />
        <ButtonIcon
          v-if="user?.role === UserRole.ADMIN"
          class="administration"
          icon="screwdriver-wrench"
          text="Paramètres admin"
          :selected="view === 'administration'"
          @click="view = 'administration'"
        />
      </nav>
      <RoomManager v-if="view === 'room'" />
      <FriendList v-if="view === 'friends'" @conversation="handleNewConversation" />
      <PrivateMessagery v-if="view === 'messages'" v-model="conversationContact" />
      <AdminPanel v-if="view === 'administration' && user?.role === UserRole.ADMIN" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import RoomManager from '../components/RoomManager/RoomManager.vue'
import { PlayerInfoDto, UserRole } from 'shared'
import ButtonIcon from '../components/ButtonIcon/ButtonIcon.vue'
import FriendList from '../components/FriendList/FriendList.vue'
import PrivateMessagery from '../components/PrivateMessagery/PrivateMessagery.vue'
import AdminPanel from '../components/AdminPanel/AdminPanel.vue'
// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { room } = storeToRefs(socketStore)
const { askFriendsInfo } = socketStore
const { user } = storeToRefs(authStore)

// Composables
const $router = useRouter()

// Refs
const view = ref<'room' | 'friends' | 'messages' | 'history' | 'settings' | 'administration'>(
  'room',
)
const conversationContact = ref<PlayerInfoDto>()
// Watchers
watch(
  () => room.value?.id,
  (roomId) => {
    if (roomId) {
      $router.replace({ name: 'Lobby', params: { roomId } })
    }
  },
  { immediate: true },
)
watch(
  () => user.value,
  () => {
    if (user.value === null) {
      $router.replace({ name: 'Connexion' })
    }
  },
)

// Hooks
onMounted(() => {
  if (user.value && user.value.role !== UserRole.GUEST) {
    askFriendsInfo()
  }
})

// Functions
function handleNewConversation(friend: PlayerInfoDto): void {
  conversationContact.value = friend
  view.value = 'messages'
}
</script>

<style lang="scss" scoped>
.home {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  &_welcome {
    color: $main-color;
    font-size: 2rem;
    font-weight: bold;
  }
  &_conbined-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: start;
    gap: 1rem;
    align-items: center;
    &_button-container {
      display: flex;
      gap: 0.5rem;
      top: -0.5rem;
      & .administration {
        color: $secondary-color;
        border-color: $secondary-color;
        &:hover,
        &.selected {
          background-color: $secondary-color;
          color: white;
          box-shadow: none;
        }
      }
      button {
        &.selected {
          background-color: $main-color;
          color: white;
          box-shadow: none;
        }
      }
    }
  }
}
</style>
