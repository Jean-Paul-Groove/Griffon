<template>
  <div v-if="isAdmin" class="lobby">
    <h2>Choisissez un jeu !</h2>
    <div class="lobby_game-selection">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        @click="requestGame(game.title)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore, useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useToast } from '../composables/useToast'
import type { GameSpecs } from '../components/GameCard/types/gameSpecs'
import GameCard from '../components/GameCard/GameCard.vue'

// Stores
const socketStore = useSocketStore()
const { handleConnection } = socketStore
const { socket, room, isAdmin } = storeToRefs(socketStore)
const { token } = useAuthStore()

// Constants
const apiUrl = import.meta.env.VITE_API_ADDRESS

// Composables
const $route = useRoute()
const $router = useRouter()
const $toast = useToast()
// Refs
const games = ref<GameSpecs[]>([])
// Hooks
onMounted(() => {
  const { roomId } = $route.params
  console.log('INSIDE LOBBY ON MOUNTED')
  if (!socket.value?.connected) {
    handleConnection()
  }
  if (!roomId && !room.value?.id) {
    console.log('pas de room du tout')
    $router.replace({ name: 'Landing' })
  } else {
    if (roomId && roomId != room.value?.id && socket.value)
      socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
  getAvailableGames()
})

// Functions
async function getAvailableGames(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/game')
    games.value = response.data
  } catch (err) {
    console.log(err)

    $toast.error('Impossible de récupérer les infos sur les jeux')
  }
}
async function requestGame(title: string): Promise<void> {
  const response = await axios.get(apiUrl + '/game/start/' + title, {
    headers: {
      Authorization: 'bearer ' + token,
    },
  })
  console.log(response)
}
</script>

<style scoped lang="scss">
.lobby {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 2rem;
  &_game-selection {
    width: 100%;
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
}
</style>
