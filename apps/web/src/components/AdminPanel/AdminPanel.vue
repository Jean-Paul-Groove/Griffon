<template>
  <div></div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import type { GameSpecs } from '../GameCard/types/gameSpecs'
import { useToast } from '../../composables/useToast'
import { apiUrl } from '../../helpers'

// Composables
const $toast = useToast()

// Refs
const games = ref<GameSpecs[]>([])

// Hooks
onMounted(() => {
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
</script>

<style scoped></style>
