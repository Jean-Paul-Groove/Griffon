<template>
  <div class="lobby">
    <section class="lobby_invitation">
      <h2>Invitez des amis en leur partageant un lien</h2>
      <button @click="copyRoomLink">Copier le lien</button>
    </section>
    <section v-if="isAdmin" class="lobby_pick-game">
      <DividerText color="var(--main-color)" text-color="var(--main-color)" text="Ou" />
      <h2>Choisissez un jeu !</h2>
      <div class="lobby_pick-game_selection">
        <GameCard
          v-for="game in games"
          :key="game.id"
          :game="game"
          @click="requestGame(game.title)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useToast } from '../composables/useToast'
import type { GameSpecs } from '../components/GameCard/types/gameSpecs'
import GameCard from '../components/GameCard/GameCard.vue'
import DividerText from '../components/Divider/DividerText.vue'

// Stores
const socketStore = useSocketStore()
const { handleConnection } = socketStore
const { socket, room, isAdmin } = storeToRefs(socketStore)

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
    $router.replace({ name: 'Accueil' })
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
    console.log('GETTING AVAILABLE GAMES')
    console.log(games.value)
  } catch (err) {
    console.log(err)

    $toast.error('Impossible de récupérer les infos sur les jeux')
  }
}
async function requestGame(title: string): Promise<void> {
  try {
    socket.value?.emit(WSE.ASK_START_GAME, { game: title })
  } catch (error) {
    console.log(error)
  }
}
function copyRoomLink(): void {
  window.navigator.clipboard.writeText(window.location.href)
  $toast.success('Lien copié !', { duration: 1000 })
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
  color: var(--main-color);
  &_invitation {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }
  &_pick-game {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    &_selection {
      width: 100%;
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: center;
    }
  }
}
section {
  width: 100%;
}
</style>
