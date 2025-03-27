<template>
  <div class="landing">
    <h2 v-if="user" class="landing_title">Rejoindre une Room:</h2>
    <h2 v-else class="landing_title">Connexion:</h2>
    <form class="landing-form" @submit="(e) => e.preventDefault()">
      <template v-if="user">
        <FormInput v-model="roomId" :error="roomIdError != null" label="Room ID" />
        <button @click="joinRoom(roomId)">Rejoindre</button>
        <button @click="createNewRoom">Générer une Room</button>
        <button v-if="user.room" @click="joinRoom(user.room)">
          Rejoindre la Room précédente
        </button></template
      >
      <template v-else>
        <div v-if="requestedRoom !== null">Connectez-vous avant de rejoindre vos amis</div>
        <FormInput v-model="username" :error="usernameError != null" label="Pseudo" />
        <button @click="signIn">Connexion en tant qu'invité</button>
      </template>
    </form>
    <div class="landing_errors">
      <p v-if="roomIdError && user">{{ roomIdError }}</p>
      <p v-if="usernameError && !user">{{ usernameError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import FormInput from '../components/form/FormInput.vue'
import { useToast } from '../composables/useToast'
// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { setToken, setRequestedRoom } = authStore
const { socket, room } = storeToRefs(socketStore)
const { user, requestedRoom } = storeToRefs(authStore)

// Composables
const $router = useRouter()
const $toast = useToast()
// Constants
const apiUrl = import.meta.env.VITE_API_ADDRESS

// Refs
const username = ref<string>('')
const roomId = ref<string>('')
const checkForErrors = ref(false)
const roomIdError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return roomId.value.trim() === '' ? 'Veuiller entrer un identifiant de room valide' : null
})
const usernameError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return username.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
})
// Watchers
watch(
  () => user.value,
  () => {
    if (user.value !== null && requestedRoom.value) {
      joinRoom(requestedRoom.value)
      setRequestedRoom(null)
    }
  },
)
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
  try {
    checkForErrors.value = true
    if (username.value.length > 0) {
      const response = await axios.post(apiUrl + '/auth/guest', { username: username.value })
      const jwt = response?.data?.access_token
      checkForErrors.value = false
      if (jwt) {
        setToken(jwt)
      }
    }
  } catch (error) {
    console.log(error)
  }
}
function joinRoom(id: string): void {
  checkForErrors.value = true
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
    width: 25rem;
    padding: 2rem;
    border: 0.1rem solid var(--main-color);
    height: fit-content;
    border-radius: 1rem;
  }
  &_errors {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    color: var(--secondary-color);
    font-weight: bold;
  }
}
</style>
