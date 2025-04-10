<template>
  <div class="landing">
    <form v-if="user" class="landing_form" @submit="(e) => e.preventDefault()">
      <h2 class="landing_form_title">Rejoindre une partie:</h2>
      <FormInput v-model="roomId" :error="roomIdError != null" label="Room ID" />
      <button class="landing_form_button" @click="joinRoom(roomId)">Rejoindre</button>
      <DividerText color="var(--main-color)" text-color="var(--main-color)" text="ou" />
      <button class="landing_form_button" @click="createNewRoom">Créer une parite</button>
      <DividerText
        v-if="user.room"
        color="var(--main-color)"
        text-color="var(--main-color)"
        text="ou"
      />

      <button v-if="user.room" class="landing_form_button" @click="joinRoom(user.room)">
        Rejoindre la Room précédente
      </button>
    </form>
    <Login v-else />

    <div class="landing_errors">
      <p v-if="roomIdError && user">{{ roomIdError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import FormInput from '../components/form/FormInput.vue'
import Login from '../components/Login/LoginForm.vue'
import DividerText from '../components/Divider/DividerText.vue'
// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { setRequestedRoom } = authStore
const { socket, room } = storeToRefs(socketStore)
const { user, requestedRoom } = storeToRefs(authStore)

// Composables
const $router = useRouter()

// Refs
const roomId = ref<string>('')
const checkForErrors = ref(false)
const roomIdError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return roomId.value.trim() === '' ? 'Veuiller entrer un identifiant de room valide' : null
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
      $router.replace({ name: 'Lobby', params: { roomId } })
    }
  },
  { immediate: true },
)
// Functions
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
  margin-top: 5rem;
  align-items: center;

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
}
</style>
