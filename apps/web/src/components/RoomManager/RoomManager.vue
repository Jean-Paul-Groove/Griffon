<template>
  <form v-if="user" class="room-manager_form" @submit="(e) => e.preventDefault()">
    <h3 class="room-manager_form_title">Rejoindre un salon</h3>

    <FormInput
      v-model="roomId"
      input-id="room-id"
      :error="roomIdError != null"
      label="Id du salon"
    />
    <button class="room-manager_form_button" @click="joinRoom(roomId)">Rejoindre</button>
    <DividerText color="$main-color" text-color="$main-color" text="ou" />
    <button class="room-manager_form_button" @click="createNewRoom">Créer un salon</button>
    <DividerText v-if="user.room" color="$main-color" text-color="$main-color" text="ou" />

    <button v-if="user.room" class="room-manager_form_button" @click="joinPrevious">
      Rejoindre le salon précédent
    </button>
  </form>
</template>

<script setup lang="ts">
import DividerText from '../Divider/DividerText.vue'
import FormInput from '../form/FormInput.vue'

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSocketStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
// Stores
const authStore = useAuthStore()
const socketStore = useSocketStore()
const { setRequestedRoom } = authStore
const { socket, room } = storeToRefs(socketStore)
const { user, requestedRoom } = storeToRefs(authStore)

// Composables
const $router = useRouter()
// Refs
const roomId = ref<string>(user.value?.room || '')
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
    if (user.value !== null) {
      if (requestedRoom.value) {
        joinRoom(requestedRoom.value)
        setRequestedRoom(null)
        return
      }
      if (user.value.room) {
        joinRoom(user.value.room)
      }
    }
  },
  { immediate: true },
)
watch(
  () => room.value?.id,
  (roomId) => {
    if (roomId) {
      $router.replace({ name: 'Salon', params: { roomId } })
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
function joinPrevious(): void {
  if (user.value?.room) {
    roomId.value = user.value?.room
    joinRoom(user.value.room)
  }
}
</script>

<style lang="scss" scoped>
.room-manager {
  height: 100%;
  width: 100%;
  display: flex;
  padding-top: 5rem;
  flex-direction: column;
  justify-content: start;
  margin-top: 5rem;
  align-items: center;
  &_welcome {
    color: $main-color;
    font-size: 2rem;
    font-weight: bold;
  }
  &_form {
    @include white-card;
    flex-direction: column;
    gap: 1rem;
    height: fit-content;
    margin-top: 2rem;
    min-width: 300px;
    position: relative;
    color: $main-color;
    &_title {
      color: $main-color;
      text-align: center;
    }
    &_button {
      color: $main-color;
      background-color: $second-color;
      border: 1px solid $main-color;
      &:hover {
        box-shadow: none;
        border-color: $second-color;
      }
    }
  }
  &_errors {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    color: $danger-color;
    font-weight: bold;
  }
}
</style>
