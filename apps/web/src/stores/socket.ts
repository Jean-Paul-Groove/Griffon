import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { WSE } from 'wse'
import type { User } from '../types/User'

type ListenerRecord = {
  [key in WSE]?: (arg: any) => void
}

export const useSocketStore = defineStore('socket', () => {
  // Composables
  const { token, resetToken, setUserId } = useAuthStore()
  const socket = ref<Socket | null>(null)
  const gameSpace = ref<Socket | null>(null)
  const chatSpace = ref<Socket | null>(null)
  const isConnected = computed<boolean>(() => {
    if (socket.value) {
      return socket.value.connected
    }
    return false
  })

  // Constants
  const genericListeners: ListenerRecord = {
    [WSE.INVALID_TOKEN]: resetToken,
    [WSE.CONNECTION_SUCCESS]: (data: User) => {
      if (data) {
        setUserId(data)
      }
    },
    [WSE.DISCONNECTION]: (reason) => {
      console.log('disconnect reason ', reason)
      if (reason === 'io server disconnect') {
        resetToken()
      }
    },
  }

  // Watchers
  watch(() => token, handleConnection, { immediate: true })

  // Functions
  function handleConnection(): void {
    if (!token) {
      if (isConnected.value && socket.value) {
        socket.value.disconnect()
      }
      socket.value = null
      gameSpace.value = null
      chatSpace.value = null
      return
    }
    if (!socket.value) {
      socket.value = io(import.meta.env.VITE_API_ADDRESS, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: `bearer ${token}`,
        },
        reconnectionAttempts: 5,
      })
      connectNamespaces()
    }
    if (!isConnected.value && socket.value != null) {
      socket.value.connect()
    }
    setUpListeners(genericListeners)
  }
  function connectNamespaces(): void {
    gameSpace.value = io(import.meta.env.VITE_API_ADDRESS + '/game', {
      auth: {
        token: `bearer ${token}`,
      },
    })

    chatSpace.value = io(import.meta.env.VITE_API_ADDRESS + '/chat', {
      auth: {
        token: `bearer ${token}`,
      },
    })
  }
  function setUpListeners(
    record: ListenerRecord,
    space: 'GLOBAL' | 'GAME' | 'CHAT' = 'GLOBAL',
  ): void {
    switch (space) {
      case 'GAME':
        assignListeners(gameSpace.value as Socket, record)
        break
      case 'CHAT':
        assignListeners(chatSpace.value as Socket, record)

        break
      default:
        assignListeners(socket.value as Socket, record)
    }
  }
  function assignListeners(space: Socket | null, record: ListenerRecord): void {
    if (space && space.on) {
      for (const key of Object.keys(record) as WSE[]) {
        const handler = record[key]

        if (handler != null && !space.listeners(key).includes(handler)) {
          space.on(key, handler)
        }
      }
    }
  }
  return { socket, gameSpace, chatSpace, setUpListeners }
})
