import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { User } from '../types/User'

export const useAuthStore = defineStore('auth', () => {
  const TOKEN_KEY = 'JWT'
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)
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
  function setUserInfo(userInfo: User): void {
    if (userInfo != null) {
      user.value = userInfo
    }
  }
  function resetToken(): void {
    console.log('RESET TOKEN')
    token.value = null
    localStorage.removeItem(TOKEN_KEY)

    user.value = null
  }

  return { token, user, setToken, resetToken, setUserInfo }
})
