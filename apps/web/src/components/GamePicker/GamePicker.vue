<template>
  <div class="game-picker">
    <p>Choisissez un jeu !</p>
    <div class="game-picker_list">
      <GameCard v-for="game in games" :key="game.id" :game="game" @click="requestGame(game.id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCard from '../GameCard/GameCard.vue'
import { onMounted, ref } from 'vue'

import { useSocketStore } from '../../stores'
import { storeToRefs } from 'pinia'
import { WSE } from 'shared'
import axios from 'axios'
import { useToast } from '../../composables/useToast'
import type { GameSpecs } from '../GameCard/types/gameSpecs'
import { apiUrl } from '../../helpers'

// Refs
const games = ref<GameSpecs[]>([])

// Stores
const socketStore = useSocketStore()
const { socket } = storeToRefs(socketStore)

// Composables
const $toast = useToast()

// Hooks
onMounted(() => {
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
async function requestGame(id: string): Promise<void> {
  try {
    socket.value?.emit(WSE.ASK_START_GAME, { game: id })
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="scss" scoped>
.game-picker {
  &_list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
}
</style>
