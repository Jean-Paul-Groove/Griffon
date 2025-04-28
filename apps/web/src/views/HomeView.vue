<template>
  <div class="home">
    <p v-if="user" class="home_welcome">Bienvenue {{ user.name }} !</p>
    <div v-if="user?.isGuest"></div>
    <div v-else class="home_conbined-view">
      <div class="home_conbined-view_button-container">
        <button
          :class="{ selected: view === 'room' }"
          title="Rejoindre un salon"
          @click="view = 'room'"
        >
          <FontAwesomeIcon icon="dice" />
        </button>
        <button :class="{ selected: view === 'firends' }" title="Amis" @click="view = 'friends'">
          <FontAwesomeIcon icon="users" />
        </button>
        <button
          :class="{ selected: view === 'history' }"
          title="Historique des parties"
          @click="view = 'history'"
        >
          <FontAwesomeIcon icon="clock" />
        </button>
        <button
          :class="{ selected: view === 'settings' }"
          title="Paramètres du profil"
          @click="view = 'settings'"
        >
          <FontAwesomeIcon icon="user-gear" />
        </button>
      </div>
      <RoomManager v-if="view === 'room'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import RoomManager from '../components/RoomManager/RoomManager.vue'
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
  padding-top: 2rem;
  justify-content: center;
  align-items: center;
  &_welcome {
    color: var(--main-color);
    font-size: 2rem;
    font-weight: bold;
  }
  &_form {
    flex-direction: column;
    gap: 1rem;
    height: fit-content;
    margin-top: 2rem;
    display: flex;
    padding: 1rem;
    min-width: 300px;
    border-radius: 0.5rem;
    box-shadow: var(--light-shadow);
    background-color: white;
    position: relative;
    color: var(--main-color);
    &_title {
      color: var(--main-color);
      text-align: center;
    }
    &_button {
      color: var(--main-color);
      background-color: white;
      border: 1px solid var(--main-color);
      &:hover {
        box-shadow: none;
        color: white;
        background-color: var(--main-color);
      }
    }
  }
  &_errors {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    color: var(--secondary-color);
    font-weight: bold;
  }
  &_conbined-view {
    position: relative;
    height: 100%;
    display: flex;
    width: 100%;
    justify-content: center;
    &_button-container {
      position: absolute;
      display: flex;
      gap: 0.5rem;
      top: -0.5rem;
      button {
        &.selected {
          background-color: var(--main-color);
          color: white;
        }
      }
    }
  }
}
</style>
