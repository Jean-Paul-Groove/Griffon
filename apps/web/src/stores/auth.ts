import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { PlayerInfoDto } from 'shared'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PlayerInfoDto | null>(null)
  const requestedRoom = ref<string | null>(null)
  // Composables
  const $router = useRouter()
  // Watchers
  watch(
    () => user.value,
    (user) => {
      if (user === null) {
        $router.replace({ name: 'Connexion' })
      }
    },
  )
  function resetUser(): void {
    user.value = null
  }
  function setPlayerInfo(playerInfo: PlayerInfoDto): void {
    if (playerInfo != null) {
      user.value = playerInfo
    }
  }
  function setRequestedRoom(value: string | null): void {
    requestedRoom.value = value
  }

  return {
    user,
    requestedRoom,
    resetUser,
    setPlayerInfo,
    setRequestedRoom,
  }
})
