import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { PlayerInfoDto } from 'shared'

export const useAuthStore = defineStore('auth', () => {
  const TOKEN_KEY = 'JWT'
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<PlayerInfoDto | null>(null)
  const requestedRoom = ref<string | null>(null)
  // Composables
  const $router = useRouter()
  // Watchers
  watch(
    () => token.value,
    (newToken) => {
      if (newToken === null) {
        $router.replace('Home')
      }
    },
  )
  function setToken(newToken: string): void {
    if (newToken && newToken.trim() !== '') {
      localStorage.setItem(TOKEN_KEY, newToken)
      token.value = newToken
    } else {
      throw new Error('INVALID TOKEN')
    }
  }
  function resetToken(): void {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)

    user.value = null
  }
  function setPlayerInfo(playerInfo: PlayerInfoDto): void {
    console.log(playerInfo)
    if (playerInfo != null) {
      user.value = playerInfo
    }
  }
  function setRequestedRoom(value: string | null): void {
    requestedRoom.value = value
  }
  return {
    token,
    user,
    requestedRoom,
    setToken,
    resetToken,
    setPlayerInfo,
    setRequestedRoom,
  }
})
