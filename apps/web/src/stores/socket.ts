import { computed, ref, watch } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import {
  ChatMessageDto,
  FailCreateRoom,
  FailJoinRoomDto,
  FailStartGame,
  NewChatMessageDto,
  PlayerConnectionSuccessDto,
  PlayerJoinedRoomDto,
  PlayerJoinedRoomSuccessDto,
  PlayerListDto,
  PlayerScoredDto,
  RoomStateDto,
  ScoreDto,
  ScoreListDto,
  StartGameDto,
  TimeLimitDto,
  WordToDrawDto,
  WSE,
  type PlayerInfoDto,
  type RoomInfoDto,
} from 'shared'
import { useRoute, useRouter } from 'vue-router'

type ListenerRecord = {
  [key in WSE]?: (arg: any) => void
}

export const useSocketStore = defineStore('socket', () => {
  // Composables
  const authStore = useAuthStore()
  const { resetToken, setPlayerInfo, setRequestedRoom } = authStore
  const { token, user } = storeToRefs(authStore)
  const $router = useRouter()
  const $route = useRoute()
  const socket = ref<Socket | null>(null)
  const timeLimit = ref<number | null>(null)
  const countDown = ref<number | null>(null)
  const cdDuration = ref<number | null>(null)
  // Constants
  const SYSTEM: PlayerInfoDto = {
    id: 'SYSTEM',
    name: 'Griffon',
    isGuest: false,
    isArtist: false,
  }
  const SYSTEM_ID = -1
  const genericListeners: ListenerRecord = {
    [WSE.INVALID_TOKEN]: resetToken,
    [WSE.CONNECTION_SUCCESS]: (data: PlayerConnectionSuccessDto['arguments']) => {
      if (data) {
        setPlayerInfo(data.player)
      }
    },
    [WSE.DISCONNECTION]: (reason) => {
      console.log('disconnect reason ', reason)
      if (reason === 'io server disconnect') {
        resetToken()
      }
    },
    [WSE.NEW_MESSAGE]: (data: NewChatMessageDto['arguments']): void => {
      if (data) {
        console.log('RECEIVED')
        addMessage(data.chatMessage)
      }
    },
    [WSE.USER_JOINED_ROOM_SUCCESS]: (data: PlayerJoinedRoomSuccessDto['arguments']): void => {
      if (data) {
        setRoomInfo(data.room)
      }
    },
    [WSE.FAIL_JOIN_ROOM]: (data: FailJoinRoomDto['arguments']): void => {
      if (data) {
        console.log(data.reason)
        $router.push({ name: 'Landing' })
      }
    },
    [WSE.FAIL_CREATE_ROOM]: (data: FailCreateRoom['arguments']): void => {
      if (data) {
        console.log(data.reason)
        $router.push({ name: 'Landing' })
      }
    },
    [WSE.WORD_TO_DRAW]: (data: WordToDrawDto['arguments']): void => {
      if (data) {
        setWordToDraw(data.word)
      }
    },
    [WSE.USER_JOINED_ROOM]: (data: PlayerJoinedRoomDto['arguments']): void => {
      if (data) {
        systemMessage(`${data.player.name} joined the Room`)
      }
    },
    [WSE.ROOM_STATE]: (data: RoomStateDto['arguments']): void => {
      if (data) {
        setRoomInfo(data.room)
      }
    },
    [WSE.START_GAME]: (data: StartGameDto['arguments']) => {
      if (data && room.value) {
        room.value.currentGame = data.game
        systemMessage(`New ${data.game.specs.title} is starting`)
      }
    },
    [WSE.FAIL_START_GAME]: (data: FailStartGame['arguments']) => {
      if (data) {
        console.log(data.reason)
      }
    },
    [WSE.STOP_DRAW]: (): void => {
      if (isArtist.value && currentPlayer.value) {
        currentPlayer.value.isArtist = false
      }
    },
    [WSE.PLAYER_LIST]: (data: PlayerListDto['arguments']): void => {
      if (data) {
        updateUsers(data.players)
        const artist = data.players.find((player) => player.isArtist === true)
        if (artist) {
          systemMessage(`${artist?.name} is drawing`)
        }
      }
    },
    [WSE.SCORE_LIST]: (data: ScoreListDto['arguments']): void => {
      if (data) {
        updateScores(data.scores)
      }
    },
    [WSE.PLAYER_SCORED]: (data: PlayerScoredDto['arguments']): void => {
      if (data) {
        systemMessage(`${data.player.name} scored ${data.points} points`)
        updatePartialScores(data)
      }
    },
    [WSE.TIME_LIMIT]: (data: TimeLimitDto['arguments']): void => {
      if (data) {
        initCountdown(data.time)
      }
    },
  }

  // Refs
  const room = ref<RoomInfoDto | null>(null)
  const chatMessages = ref<Array<ChatMessageDto>>([])
  const wordToDraw = ref<string>('')

  // Computeds
  const currentPlayer = computed<PlayerInfoDto | null>(() => {
    return room.value?.players.find((player) => player.id === user.value?.id) ?? null
  })
  const isArtist = computed<boolean>(() => {
    return currentPlayer.value?.isArtist === true
  })
  const isAdmin = computed<boolean>(() => {
    if (room.value?.admin && room.value.admin === currentPlayer.value?.id) {
      return true
    }

    return false
  })
  // Watchers
  watch(() => token.value, handleConnection, { immediate: true })
  watch(
    () => socket.value?.connected,
    () => {
      handleConnection()
    },
  )
  watch(
    () => room.value?.currentGame?.specs.title,
    (game) => {
      console.log('NEW GAME WATCHED')
      const currentRoute = $route.name
      // Redirect to Lobby if no current game
      if (!game) {
        if (room.value != null) {
          if (currentRoute !== 'Lobby') {
            $router.push({ name: 'Lobby', params: { roomId: room.value.id } })
          }
        }
        return
      }
      // Redirect to game
      if (game != null && room.value?.id != null && currentRoute != game) {
        console.log('NAVIGATING TO GAME')
        $router.push({ name: game, params: { roomId: room.value.id } })
      }
    },
  )
  watch(
    () => room.value,
    () => {
      if (room.value === null) {
        $router.push({ name: 'Landing' })
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
    console.log(socket.value?.listenersAny)
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
    chatMessages.value = [...newRoom.chatMessages]
  }
  function addMessage(message: ChatMessageDto): void {
    if (room.value) {
      room.value.chatMessages.push(message)
      chatMessages.value.push(message)
    }
  }
  function systemMessage(content: string): void {
    if (!room.value) {
      return
    }
    addMessage({
      content,
      sender: SYSTEM.id,
      sentAt: new Date(),
      id: -1,
      room: room.value?.id,
    })
  }
  function setWordToDraw(word: string): void {
    wordToDraw.value = word
  }
  function updateUsers(players: PlayerInfoDto[]): void {
    if (room.value) {
      room.value.players = [...players]
    }

    if (user.value) {
      const currentUser = players.find((u) => u.id === user.value?.id)
      if (currentUser) {
        setPlayerInfo(currentUser)
      }
    }
  }
  function updateScores(scores: ScoreDto[]): void {
    if (room.value) {
      room.value.scores = [...scores]
    }
  }
  function updatePartialScores(partialScore: PlayerScoredDto['arguments']): void {
    if (!room.value) {
      return
    }
    const score = room.value.scores.find((score) => score.player === partialScore.player.id)
    if (score) {
      score.points += partialScore.points
    } else {
      room.value.scores.push({
        id: '',
        points: partialScore.points,
        player: partialScore.player.id,
        room: room.value.id,
      })
    }
  }
  function endCountDown(id: number): void {
    clearInterval(id)
    timeLimit.value = null
    countDown.value = null
    cdDuration.value = null
  }
  function initCountdown(time: number): void {
    if (timeLimit.value != null || countDown.value != null) {
      timeLimit.value = null
      countDown.value = null
    }
    const now = Date.now()
    if (time - now <= 0) {
      return
    }
    timeLimit.value = time
    const countDownDuration = Math.round((time - now) / 1000)
    countDown.value = countDownDuration
    cdDuration.value = countDownDuration
    const id = setInterval(() => {
      console.log('CountDown')
      if (!countDown.value || countDown.value === 0) {
        endCountDown(id)
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
  function getUserById(id: string): PlayerInfoDto | undefined {
    if (id === SYSTEM.id) {
      return SYSTEM
    }
    if (room.value) {
      return room.value.players.find((player) => player.id === id)
    }
  }
  function getUserPoints(id: string): ScoreDto | undefined {
    if (room.value) {
      return room.value.scores.find((score) => score.player === id)
    }
  }
  function leaveRoom(): void {
    try {
      if (!socket.value) {
        return
      }
      socket.value.emit(WSE.ASK_LEAVE_ROOM, { roomId: room.value?.id })
      room.value = null
      chatMessages.value = []
      wordToDraw.value = ''
      setRequestedRoom(null)
    } catch (error) {
      console.log(error)
    }
  }
  function excludePlayer(playerId: string): void {
    try {
      if (!socket.value || !isAdmin.value) {
        return
      }
      socket.value.emit(WSE.ASK_EXCLUDE_PLAYER, { playerId })
    } catch (error) {
      console.log(error)
    }
  }
  return {
    socket,
    room,
    chatMessages,
    wordToDraw,
    SYSTEM_ID,
    countDown,
    isArtist,
    isAdmin,
    currentPlayer,
    setListeners,
    handleConnection,
    getUserById,
    getUserPoints,
    leaveRoom,
    excludePlayer,
  }
})
