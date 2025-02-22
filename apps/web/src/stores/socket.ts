import { computed, ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { WSE } from 'wse'
import type { GameName, Message, NewMessageDto, Player, RoomInfoDto, User } from 'dto'
import { useRoute, useRouter } from 'vue-router'

type ListenerRecord = {
  [key in WSE]?: (arg: any) => void
}

export const useSocketStore = defineStore('socket', () => {
  // Composables
  const authStore = useAuthStore()
  const { resetToken, setUserInfo, setIsAdmin } = authStore
  const { token, user } = storeToRefs(authStore)
  const $router = useRouter()
  const $route = useRoute()
  const socket = ref<Socket | null>(null)
  const timeLimit = ref<number | null>(null)
  const countDown = ref<number | null>(null)
  const player = computed<Player | null>(() => {
    if (!room.value || !user.value) {
      return null
    }
    const player = room.value?.players.find((player) => player.id === user.value?.id)
    return player ?? null
  })
  // Constants
  const SYSTEM: User = {
    id: 'SYSTEM',
    name: 'Griffon',
  }
  const SYSTEM_ID = -1
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
    [WSE.USER_JOINED_ROOM_SUCCESS]: (data: RoomInfoDto): void => {
      if (data) {
        setRoomInfo(data)
      }
    },
    [WSE.WORD_TO_DRAW]: (data: string): void => {
      if (data) {
        setWordToDraw(data)
      }
    },
    [WSE.USER_JOINED_ROOM]: (data: User): void => {
      if (data) {
        systemMessage(`${data.name} joined the Room`)
      }
    },
    [WSE.START_GAME]: (data: GameName) => {
      if (data && room.value) {
        room.value.currentGame = data
        addMessage({
          content: `New ${data} starting`,
          sender: SYSTEM,
          sent_at: Date.now(),
          id: SYSTEM_ID,
        })
      }
    },
    [WSE.CAN_DRAW]: (data: User): void => {
      if (data) {
        setUserInfo(data)
      }
    },
    [WSE.STOP_DRAW]: (): void => {
      if (player.value?.isDrawing) {
        player.value.isDrawing = false
      }
    },
    [WSE.NEW_ARTIST]: (data: Player[]): void => {
      if (data) {
        updateUsers(data)
        const artist = data.find((player) => player.isDrawing === true)
        systemMessage(`${artist?.name} is drawing`)
      }
    },
    [WSE.PLAYER_SCORED]: (data: { player: User; points: number }): void => {
      if (data) {
        systemMessage(`${data.player.name} scored ${data.points} points`)
      }
    },
    [WSE.TIME_LIMIT]: (data: number): void => {
      if (data) {
        initCountdown(data)
      }
    },
  }

  // Refs
  const room = ref<RoomInfoDto | null>(null)
  const messages = ref<Array<Message | NewMessageDto>>([])
  const wordToDraw = ref<string>('')

  // Watchers
  watch(() => token.value, handleConnection, { immediate: true })
  watch(
    () => socket.value?.connected,
    () => {
      handleConnection()
    },
  )
  watch(
    () => room.value,
    () => {
      let isAdmin
      if (!room.value || !user.value) {
        isAdmin = false
      } else {
        isAdmin = room.value.owner === user.value.id
      }
      setIsAdmin(isAdmin)
    },
  )
  watch(
    () => room.value?.currentGame,
    (value) => {
      const currentRoute = $route.name
      // Redirect to Lobby if no current game
      if (value === undefined || value === null) {
        if (room.value != null) {
          if (currentRoute !== 'Lobby') {
            $router.push({ name: 'Lobby', params: { roomId: room.value.id } })
          }

          // Redirect to landing if no room
        } else if (currentRoute !== 'Landing') {
          $router.push({ name: 'Landing' })
        }
        return
      }
      // Redirect to game
      if (value != null && room.value?.id != null && currentRoute != value) {
        $router.push({ name: value, params: { roomId: room.value.id } })
      }
    },
  )
  // Functions
  function handleConnection(): void {
    if (!token.value) {
      removeSocket()
      return
    }
    connectSocket()
    setListeners(genericListeners)
    if (socket.value?.listenersAny.length === 0) {
      socket.value?.onAny((event, args) => {
        console.log(event, args)
      })
    }
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
  function setRoomInfo(newRoom: RoomInfoDto): void {
    room.value = JSON.parse(JSON.stringify(newRoom))
    messages.value = [...newRoom.messages]
  }
  function addMessage(message: Message): void {
    if (room.value) {
      room.value.messages.push(message)
      messages.value.push(message)
    }
  }
  function systemMessage(content: string): void {
    addMessage({
      content,
      sender: SYSTEM,
      sent_at: Date.now(),
      id: -1,
    })
  }
  function setWordToDraw(word: string): void {
    wordToDraw.value = word
  }
  function updateUsers(players: Player[]): void {
    if (room.value) {
      room.value.players = [...players]
    }

    if (user.value) {
      const currentUser = players.find((u) => u.id === user.value?.id)
      if (currentUser) {
        setUserInfo(currentUser)
      }
    }
  }
  function endTimeOut(id: number): void {
    clearInterval(id)
    timeLimit.value = null
    countDown.value = null
  }
  function initCountdown(time: number): void {
    if (timeLimit.value != null || countDown.value != null) {
      console.log('not null')
      return
    }
    const now = Date.now()
    if (time - now <= 0) {
      console.log(time, now)
      return
    }
    timeLimit.value = time
    countDown.value = Math.round((time - now) / 1000)
    const id = setInterval(() => {
      console.log('INTERVAL')
      if (!countDown.value) {
        endTimeOut(id)
        return
      }
      if (countDown.value === 0) {
        endTimeOut(id)
        return
      }
      if (countDown.value - 1 < 0) {
        countDown.value = 0
        return
      }
      countDown.value--
      return
    }, 1000)
  }
  return {
    socket,
    room,
    player,
    messages,
    wordToDraw,
    SYSTEM_ID,
    countDown,
    setListeners,
    handleConnection,
  }
})
