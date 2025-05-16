import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { PlayerInfoDto } from 'shared'
import { getImageUrl } from '../helpers/avatars'

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
  async function setPlayerInfo(playerInfo: PlayerInfoDto, refreshAvatar?: boolean): Promise<void> {
    if (playerInfo != null) {
      user.value = playerInfo
    }
    if (refreshAvatar && user.value?.avatar) {
      await caches.delete(getImageUrl(user.value?.avatar))
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
