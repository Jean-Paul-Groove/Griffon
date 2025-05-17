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
  UpdateFriendsInfoDto,
  UserRole,
  WordSolutionDto,
  WordToDrawDto,
  WSE,
  type PlayerInfoDto,
  type RoomInfoDto,
} from 'shared'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import axios from 'axios'
import { apiUrl } from '../helpers'

type ListenerRecord = {
  [key in WSE]?: (arg: any) => void
}

export const useSocketStore = defineStore('socket', () => {
  // Composables
  const authStore = useAuthStore()
  const { setPlayerInfo, setRequestedRoom, resetUser } = authStore
  const { user } = storeToRefs(authStore)
  const $router = useRouter()
  const $route = useRoute()
  const $toast = useToast()
  // Constants
  const SYSTEM: PlayerInfoDto = {
    id: 'SYSTEM',
    name: 'Griffon',
    role: UserRole.ADMIN,
    isArtist: false,
    avatar: undefined,
  }
  const socketListeners: ListenerRecord = {
    [WSE.INVALID_TOKEN]: disconnectSocket,
    [WSE.CONNECTION_SUCCESS]: (data: PlayerConnectionSuccessDto['arguments']) => {
      if (data) {
        setPlayerInfo(data.player)
      }
    },
    [WSE.DISCONNECTION]: (reason) => {
      // If server initialized disconnexion, disconnect and reset refs
      if (reason === 'io server disconnect') {
        disconnectSocket()
      }
    },

    [WSE.USER_JOINED_ROOM_SUCCESS]: (data: PlayerJoinedRoomSuccessDto['arguments']): void => {
      if (data) {
        if (room.value === null) {
          $toast.success('Vous avez rejoint le salon avec succès !')
        }
        setRoomInfo(data.room)
      }
    },
    [WSE.FAIL_JOIN_ROOM]: (data: FailJoinRoomDto['arguments']): void => {
      if (data) {
        // Redirige vers la page d'accueil si n'y est pas déjà
        if ($route.name !== 'Accueil' && user.value) {
          $router.replace({ name: 'Accueil' })
        }
        // Toast d'erreur
        if (data.reason === 'room-full') {
          $toast.error('Arf ! La room est déjà pleine ...')
        } else if (data.reason === 'room-not-found') {
          $toast.error("Ce salon n'exsite pas ...")
        } else {
          $toast.error('Impossible de rejoindre ce salon')
        }
      }
    },
    [WSE.FAIL_CREATE_ROOM]: (data: FailCreateRoom['arguments']): void => {
      if (data) {
        $toast.error('Nous ne pouvons générer de salon...')
      }
    },
    [WSE.WORD_TO_DRAW]: (data: WordToDrawDto['arguments']): void => {
      if (data) {
        setWordToDraw(data.word)
      }
    },
    [WSE.WORD_SOLUTION]: (data: WordSolutionDto['arguments']): void => {
      if (data) {
        systemMessage(`Le mot à deviné était ${data.word}`)
      }
    },
    [WSE.USER_JOINED_ROOM]: (data: PlayerJoinedRoomDto['arguments']): void => {
      if (data) {
        systemMessage(`${data.player.name} à rejoint le salon`)
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
        systemMessage(`Une partie de ${data.game.specs.title} commence !`)
      }
    },
    [WSE.FAIL_START_GAME]: (data: FailStartGame['arguments']) => {
      if (data) {
        $toast.error('Impossible de lancer cette partie ...')
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
          systemMessage(`${artist?.name} dessine !`)
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
        systemMessage(`${data.player.name} a marqué ${data.points} points`)
        updatePartialScores(data)
      }
    },
    [WSE.ROOM_NOT_FOUND]: (): void => {
      $toast.error("Ce salon n'existe pas...")
    },
    [WSE.TIME_LIMIT]: (data: TimeLimitDto['arguments']): void => {
      if (data) {
        initCountdown(data.time)
      }
    },
    // ERROR MANAGEMENT
    [WSE.PLAYER_NOT_FOUND]: (): void => {
      $toast.error('Ce joueur est introuvable')
    },
    [WSE.GAME_NOT_FOUND]: (): void => {
      $toast.error('La partie est introuvable ...')
    },
    [WSE.ROUND_NOT_FOUND]: (): void => {
      $toast.error('La manche est introuvable...')
    },
    [WSE.UNAUTHORIZED]: (): void => {
      $toast.error("Vous n'êtes pas authorisé à faire ça...")
    },
    [WSE.USER_ALREADY_CONNECTED]: (): void => {
      $toast.error('Vous êtes déjà connecté ailleurs ...')
    },
    // CHAT
    [WSE.NEW_CHAT_MESSAGE]: (data: NewChatMessageDto['arguments']): void => {
      if (data) {
        addMessage(data.chatMessage)
      }
    },
    // FRIENDS
    [WSE.UPDATE_FRIENDS_INFO]: (data: UpdateFriendsInfoDto['arguments']): void => {
      if (data.friends) {
        friends.value = [...data.friends]
      }
    },
  }
  // Refs
  const room = ref<RoomInfoDto | null>(null)
  const roomMessages = ref<Array<ChatMessageDto>>([])
  const systemMessages = ref<Array<ChatMessageDto>>([])
  const wordToDraw = ref<string>('')
  const socket = ref<Socket | null>(null)
  const timeLimit = ref<number | null>(null)
  const countDown = ref<number | null>(null)
  const cdDuration = ref<number | null>(null)
  const countDownInterval = ref<number | null>(null)
  const friends = ref<Array<PlayerInfoDto & { online: boolean }>>([])
  const autoReconnect = ref<boolean>(true)
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

  const chatMessages = computed<Array<ChatMessageDto>>(() => {
    return [...roomMessages.value, ...systemMessages.value]
  })

  // Watchers
  watch(
    () => socket.value?.connected,
    () => {
      handleConnection()
    },
  )
  watch(
    () => room.value?.currentGame?.specs.title,
    (game) => {
      const currentRoute = $route.name
      // Redirect to Lobby if no current game
      if (!game) {
        if (room.value != null) {
          if (currentRoute !== 'Lobby') {
            $router.replace({ name: 'Lobby', params: { roomId: room.value.id } })
          }
        }
        return
      }
      // Redirect to game
      if (game != null && room.value?.id != null && currentRoute != game) {
        $router.replace({ name: game, params: { roomId: room.value.id } })
      }
    },
  )
  watch(
    () => room.value,
    () => {
      if (room.value === null) {
        if (user.value === null) {
          $router.replace({ name: 'Connexion' })
        } else {
          $router.replace({ name: 'Accueil' })
        }
      }
    },
  )
  // Functions
  function handleConnection(): void {
    if (autoReconnect.value) {
      setListeners(socketListeners)
      connectSocket()
    }
  }
  function connectSocket(): void {
    if (socket.value == null) {
      socket.value = io(import.meta.env.VITE_API_ADDRESS, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 20,
        timeout: 30000,
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
    roomMessages.value = [...newRoom.chatMessages]
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
    systemMessages.value.push({
      content,
      sender: SYSTEM,
      sentAt: new Date(),
      id: '-1',
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
        points: partialScore.points,
        player: partialScore.player.id,
      })
    }
  }
  function endCountDown(): void {
    if (countDownInterval.value) {
      clearInterval(countDownInterval.value)
    }

    timeLimit.value = null
    countDown.value = null
    cdDuration.value = null
    countDownInterval.value = null
  }
  function initCountdown(time: number): void {
    if (timeLimit.value != null || countDown.value != null) {
      timeLimit.value = null
      countDown.value = null
    }
    if (countDownInterval.value != null) {
      endCountDown()
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
      if (!countDown.value || countDown.value <= 0 || timeLimit.value === null) {
        endCountDown()
        return
      }
      const now = Date.now()
      countDown.value = Math.round((timeLimit.value - now) / 1000)
      return
    }, 1000)
    countDownInterval.value = id
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
      if (user.value) {
        setPlayerInfo({ ...user.value, room: undefined })
      }
      roomMessages.value = []
      systemMessages.value = []
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
  function addFriend(playerId: string): void {
    try {
      if (!socket.value || user.value?.role === UserRole.GUEST) {
        return
      }

      socket.value.emit(WSE.ASK_ADD_FRIEND, { playerId })
    } catch (error) {
      console.log(error)
    }
  }
  function askFriendsInfo(): void {
    if (socket.value) {
      socket.value.emit(WSE.ASK_FRIENDS_INFO)
    }
  }
  function disconnectSocket(): void {
    autoReconnect.value = false
    friends.value = []
    room.value = null
    roomMessages.value = []
    systemMessages.value = []
    wordToDraw.value = ''
    countDown.value = null
    timeLimit.value = null
    cdDuration.value = null
    resetUser()
    removeSocket()
  }
  function allowReconnect(): void {
    autoReconnect.value = true
    handleConnection()
  }
  async function handleDisconnect(): Promise<void> {
    try {
      await axios.delete(apiUrl + '/auth/logout', { withCredentials: true })
      disconnectSocket()
      $router.push('Connexion')
    } catch (err) {
      console.log(err)
    }
  }
  return {
    socket,
    room,
    chatMessages,
    wordToDraw,
    SYSTEM,
    countDown,
    isArtist,
    isAdmin,
    currentPlayer,
    friends,
    handleConnection,
    getUserPoints,
    leaveRoom,
    excludePlayer,
    addFriend,
    askFriendsInfo,
    allowReconnect,
    handleDisconnect,
  }
})
