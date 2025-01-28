import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { WSE } from 'wse'
export const useSocketStore = defineStore('socket', () => {
  // Composables
  const { token, resetToken } = useAuthStore()

  const socket = ref<Socket | null>(null)
  const isConnected = computed<boolean>(() => {
    return socket.value?.connected ?? false
  })
  // Watchers
  watch(() => token, handleConnection, { immediate: true })

  // Functions
  function handleConnection(): void {
    console.log('HANDLECONNEXIOn')
    if (!token) {
      if (isConnected.value && socket.value) {
        socket.value.disconnect()
        socket.value = null
      }
      console.log('TOKEN NULL')
      return
    }
    if (!socket.value) {
      console.log('SOCKET NULL')

      socket.value = io(import.meta.env.VITE_API_ADDRESS, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: `bearer ${token}`,
        },
      })
      socket.value.on(WSE.INVALID_TOKEN, resetToken)
    }
    if (!isConnected.value && socket.value != null) {
      socket.value.connect()
      console.log('SOCKET CONNECTED')
    }
  }
  return { socket }
})
