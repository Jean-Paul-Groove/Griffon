import { ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { WSE } from 'wse'
import type { User } from '../types/User'
import type { Message, Room } from '../types/Room'

type ListenerRecord = {
  [key in WSE]?: (arg: any) => void
}

export const useSocketStore = defineStore('socket', () => {
  // Composables
  const authStore = useAuthStore()
  const { resetToken, setUserInfo } = authStore
  const { token } = storeToRefs(authStore)
  const socket = ref<Socket | null>(null)

  // Constants
  const genericListeners: ListenerRecord = {
    [WSE.INVALID_TOKEN]: resetToken,
    [WSE.CONNECTION_SUCCESS]: (data: User) => {
      if (data) {
        setUserInfo(data)
      }
    },
    [WSE.DISCONNECTION]: (reason) => {
      console.log('disconnect reason ', reason)
      if (reason === 'io server disconnect') {
        resetToken()
      }
    },
    [WSE.NEW_MESSAGE]: (data: Message): void => {
      if (data) {
        console.log('NEW MESSAGE RECEIVED')
        console.log(data)
        addMessage(data)
      }
    },
    [WSE.USER_JOINED_ROOM_SUCCESS]: (data: Room): void => {
      if (data) {
        console.log('NEW ROOM')
        setRoomInfo(data)
      }
    },
  }

  // Refs
  const room = ref<Room | null>(null)
  const messages = ref<Message[]>([])

  // Watchers
  watch(() => token.value, handleConnection, { immediate: true })
  watch(
    () => socket.value?.connected,
    () => {
      console.log('SOCKETS HAVE CHANGED')
      handleConnection()
    },
  )
  // Functions
  function handleConnection(): void {
    console.log('INIT CONNECTION')
    if (!token.value) {
      removeSocket()
      return
    }
    connectSocket()
    setListeners(genericListeners)
  }
  function connectSocket(): void {
    if (token.value === null) {
      return
    }
    if (socket.value == null) {
      socket.value = io(import.meta.env.VITE_API_ADDRESS, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: `bearer ${token.value}`,
        },
        reconnectionAttempts: 5,
      })
    }
    if (socket.value && socket.value.connected === false) {
      socket.value.connect()
    }
  }
  function setListeners(record: ListenerRecord): void {
    if (socket.value) {
      for (const key of Object.keys(record) as WSE[]) {
        const handler = record[key]

        if (handler != null && !socket.value.listeners(key).includes(handler)) {
          socket.value.on(key, handler)
        } else {
          console.log("Couldn't add listener for " + key)
        }
      }
    }
  }
  function removeSocket(): void {
    if (socket.value?.connected) {
      socket.value.close()
    }
    socket.value = null
  }
  function setRoomInfo(newRoom: Room): void {
    room.value = JSON.parse(JSON.stringify(newRoom))
    messages.value = [...newRoom.messages]
  }
  // function setUsers(users: User[]): void {
  //   if (room.value) {
  //     room.value = { ...room.value, users }
  //   }
  // }
  function addMessage(message: Message): void {
    if (room.value) {
      room.value.messages.push(message)
      messages.value.push(message)
    }
  }
  return { socket, room, messages, setListeners, handleConnection }
})
