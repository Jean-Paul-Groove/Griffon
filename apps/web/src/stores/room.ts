import { onMounted, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Message, Room } from '../types/Room'
import type { User } from '../types/User'
import { useSocketStore } from './socket'
import { WSE } from 'wse'
export const useRoomstore = defineStore('room', () => {
  // Stores
  const { setUpListeners, socket } = useSocketStore()
  // Refs
  const room = ref<Room | null>(null)
  const messages = ref<Message[]>([])

  // Constants
  const GlobalRoomListeners = {
    [WSE.USER_JOINED_ROOM_SUCCESS]: (data: Room): void => {
      if (data) {
        setRoomInfo(data)
      }
    },
  }
  const ChatRoomListeners = {
    [WSE.NEW_MESSAGE]: (data: Message): void => {
      if (data) {
        console.log('NEW MESSAGE RECEIVED')
        console.log(data)
        addMessage(data)
      }
    },
  }
  // Watchers

  watch(
    () => socket,
    (value, formerSocket) => {
      if (formerSocket === null) {
        initListeners()
      }
    },
  )
  // Hooks
  onMounted(() => {
    if (socket !== null) {
      initListeners()
    }
  })
  // Functions
  function setRoomInfo(newRoom: Room): void {
    room.value = JSON.parse(JSON.stringify(newRoom))
    messages.value = [...newRoom.messages]
  }
  function setUsers(users: User[]): void {
    if (room.value) {
      room.value = { ...room.value, users }
    }
  }
  function addMessage(message: Message): void {
    if (room.value) {
      room.value.messages.push(message)
      messages.value.push(message)
    }
  }
  function initListeners(): void {
    setUpListeners(GlobalRoomListeners, 'GLOBAL')
    setUpListeners(ChatRoomListeners, 'CHAT')
  }
  return { room, messages, setUsers }
})
