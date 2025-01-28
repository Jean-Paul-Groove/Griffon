<template>
  <div>
    <input v-model="username" type="text" />
    <button @click="joinRoom">Join a room as a guest</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores'

// Composables
const { setToken } = useAuthStore()

// Hooks
console.log('INSIDE LANDING')
const apiUrl = import.meta.env.VITE_API_ADDRESS
console.log(apiUrl)
const username = ref<string>('')
const $router = useRouter()
async function joinRoom(): Promise<void> {
  console.log(apiUrl + '/auth/guest')
  const response = await axios.post(apiUrl + '/auth/guest', { username: username.value })
  const jwt = response?.data?.access_token
  if (jwt) {
    setToken(jwt)
    void $router.push('Game')
  }
}
</script>

<style lang="scss" scoped></style>
