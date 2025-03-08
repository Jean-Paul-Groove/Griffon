<template>
  <div class="landing">
    <h2 v-if="currentPlayer" class="landing_title">Rejoindre une room:</h2>
    <h2 v-else class="landing_title">Connexion:</h2>
    <form class="landing-form" @submit="(e) => e.preventDefault()">
      <template v-if="currentPlayer">
        <FormInput v-model="roomId" label="Room ID" />
        <button @click="joinRoom(roomId)">Join room</button>
        <button @click="createNewRoom">Create new room</button>
        <button v-if="currentPlayer.room" @click="joinRoom(currentPlayer.room)">
          Return to previous room
        </button></template
      >
      <template v-else>
        <FormInput v-model="username" label="Pseudo" />
        <button @click="signIn">Sign in as a guest</button>
      </template>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import FormInput from '../components/form/FormInput.vue'
import PlayerCard from '../components/PlayerList/PlayerCard.vue'

// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { setToken } = authStore
const { currentPlayer } = storeToRefs(authStore)
const { socket, room } = storeToRefs(socketStore)

// Composables
const $router = useRouter()

// Constants
const apiUrl = import.meta.env.VITE_API_ADDRESS

// Refs
const username = ref<string>('')
const roomId = ref<string>('')

// Watchers
watch(
  () => room.value?.id,
  (roomId) => {
    if (roomId) {
      $router.push({ name: 'Lobby', params: { roomId } })
    }
  },
  { immediate: true },
)
// Functions
async function signIn(): Promise<void> {
  const response = await axios.post(apiUrl + '/auth/guest', { username: username.value })
  const jwt = response?.data?.access_token
  if (jwt) {
    setToken(jwt)
  }
}

function joinRoom(id: string): void {
  if (id === '') {
    return
  }
  if (socket.value) {
    socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId: id })
  }
}
function createNewRoom(): void {
  if (socket.value) {
    socket.value.emit(WSE.ASK_CREATE_ROOM)
  }
}
</script>

<style lang="scss" scoped>
.landing {
  height: 100%;
  width: 100%;
  display: flex;
  padding-top: 5rem;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  &_title {
    color: var(--main-color);
  }
  &-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 40rem;
    padding: 2rem;
    border: 0.1rem solid var(--main-color);
    height: fit-content;
    border-radius: 1rem;
  }
}
</style>
