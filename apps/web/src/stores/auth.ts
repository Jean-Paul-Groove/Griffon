import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { PlayerInfoDto } from 'shared'

export const useAuthStore = defineStore('auth', () => {
  const TOKEN_KEY = 'JWT'
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const currentPlayer = ref<PlayerInfoDto | null>(null)
  const isAdmin = ref<boolean>(false)
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
  function setPlayerInfo(playerInfo: PlayerInfoDto): void {
    console.log(playerInfo)
    if (playerInfo != null) {
      currentPlayer.value = playerInfo
    }
  }
  function resetToken(): void {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)

    currentPlayer.value = null
  }
  function setIsAdmin(bool: boolean): void {
    isAdmin.value = bool
  }

  return {
    token,
    currentPlayer,
    isAdmin,
    setToken,
    setIsAdmin,
    resetToken,
    setPlayerInfo,
  }
})
