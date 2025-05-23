<template>
  <article class="specs-administration">
    <h3>Paramètres des jeux</h3>
    <div class="specs-administration_content_table-container">
      <TableDisplay :headers="headers" :elements="games" :row-click="onGameClicked" />
    </div>
    <EditSpecsModal
      v-if="editGameModal && gameToEdit"
      :game="gameToEdit"
      @close="editGameModal = false"
      @confirm="fetchGames"
    />
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { GameSpecs } from '../../GameCard/types/gameSpecs'
import { apiUrl } from '../../../helpers'
import axios, { AxiosError } from 'axios'
import { useToast } from '../../../composables/useToast'
import TableDisplay from '../../Table/TableDisplay.vue'
import EditSpecsModal from './EditSpecsModal.vue'
import { useSocketStore } from '../../../stores'

// Constants
const headers = [
  { title: 'Titre', key: 'title' },
  { title: 'Description', key: 'description' },
  { title: 'Règles', key: 'rules' },
  { title: 'Illustration', key: 'illustration' },
  { title: 'Durée du tour', key: 'defaultRoundDuration' },
  { title: 'Différence de points', key: 'pointStep' },
  { title: 'Points maximum', key: 'pointsMax' },
]

// Stores
const { handleDisconnect } = useSocketStore()

// Composables
const $toast = useToast()

// Refs
const games = ref<GameSpecs[]>([])
const editGameModal = ref<boolean>(false)
const gameToEdit = ref<GameSpecs | null>()
// Hooks
onMounted(() => {
  void fetchGames()
})

// Function
async function fetchGames(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/game/admin/list', {
      withCredentials: true,
    })

    if (response.data) {
      games.value = response.data.map((game: GameSpecs) => {
        game.defaultRoundDuration = game.defaultRoundDuration / 1000
        return game
      })
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.code && err.status === 401) {
        $toast.error("Vous n'avez pas les droits requis")
        handleDisconnect()
      }
    }
    $toast.error('Une erreur est survenue')
  }
}
function onGameClicked(el: GameSpecs): void {
  gameToEdit.value = el
  editGameModal.value = true
}
</script>
<style scoped lang="scss">
.specs-administration {
  @include admin-section;
  &_content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    &_table-container {
      width: 100%;
      overflow: auto;
      display: flex;
      max-height: 50rem;
      flex-direction: column;
    }
  }
}
</style>
