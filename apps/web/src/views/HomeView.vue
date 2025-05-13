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
          icon="clock"
          text="Historique"
          :selected="view === 'history'"
          @click="view = 'history'"
        />
        <ButtonIcon
          icon="user-gear"
          text="Profile"
          :selected="view === 'settings'"
          @click="view = 'settings'"
        />
      </nav>
      <RoomManager v-if="view === 'room'" />
      <FriendList v-if="view === 'friends'" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import RoomManager from '../components/RoomManager/RoomManager.vue'
import { UserRole } from 'shared'
import ButtonIcon from '../components/ButtonIcon/ButtonIcon.vue'
import FriendList from '../components/FriendList/FriendList.vue'
// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { room } = storeToRefs(socketStore)
const { user } = storeToRefs(authStore)

// Composables
const $router = useRouter()
// Refs
const view = ref<string>('room')

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
      button {
        &.selected {
          background-color: $main-color;
          color: white;
        }
      }
    }
  }
}
</style>
