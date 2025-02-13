<template>
  <div>
    <h1>LANDING</h1>
    <template v-if="user">
      <label for="">room id</label>
      <input v-model="roomId" type="text" />
      <button @click="joinRoom">Join room</button>
      <button @click="createNewRoom">Create new room</button></template
    >
    <template v-else>
      <input v-model="username" type="text" />
      <button @click="signIn">Sign in as a guest</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'wse'

// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { setToken } = authStore
const { user } = storeToRefs(authStore)
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
      console.log('REDIRECT')
      $router.push({ name: 'Lobby', params: { roomId } })
    }
  },
)
// Functions
async function signIn(): Promise<void> {
  const response = await axios.post(apiUrl + '/auth/guest', { username: username.value })
  const jwt = response?.data?.access_token
  if (jwt) {
    setToken(jwt)
  }
}

function joinRoom(): void {
  console.log(room.value)

  if (roomId.value === '') {
    return
  }
  if (socket.value) {
    socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId: roomId.value })
  }
}
function createNewRoom(): void {
  console.log(room.value)
  if (socket.value) {
    socket.value.emit(WSE.ASK_CREATE_ROOM)
  }
}
</script>

<style lang="scss" scoped></style>
