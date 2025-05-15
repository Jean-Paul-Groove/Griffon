<template>
  <section class="player-administration">
    <h3>Joueurs</h3>
    <article class="player-administration_content">
      <div class="player-administration_content_table-container">
        <TableDisplay :headers="headers" :elements="players" :row-click="onPlayerClicked" />
      </div>
      <nav class="player-administration_content_pagination" aria-label="pagination">
        <button
          v-for="page in pages"
          :key="page"
          :class="{ selected: currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
      </nav>
      <ButtonIcon
        class="player-administration_add"
        icon="plus"
        text="Ajouter un joueur"
        :selected="false"
        @click="handleNewPlayer"
      />
    </article>
    <EditPlayerModal
      v-if="playerToEdit && editModal"
      :edit-style="editStyle"
      :player="playerToEdit"
      @close="editModal = false"
      @confirm="fetchPlayers"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSocketStore } from '../../../stores'
import { DetailedPlayerDto, UserRole } from 'shared'
import { apiUrl } from '../../../helpers'
import axios, { AxiosError } from 'axios'
import TableDisplay from '../../Table/TableDisplay.vue'
import EditPlayerModal from './EditPlayerModal.vue'
import ButtonIcon from '../../ButtonIcon/ButtonIcon.vue'
import { useToast } from '../../../composables/useToast'
// Constants
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Avatar', key: 'avatar' },
  { title: 'Role', key: 'role' },
]
const emptyPlayer: DetailedPlayerDto = {
  email: '',
  id: '',
  name: '',
  room: '',
  avatar: '',
  role: UserRole.REGISTERED_USER,
}

// Store
const { handleDisconnect } = useSocketStore()

// Composables
const $toast = useToast()

// Refs
const players = ref<DetailedPlayerDto[]>([])
const totalCount = ref<number>(0)
const currentPage = ref<number>(1)
const size = ref<number>(10)
const playerToEdit = ref<DetailedPlayerDto>()
const editModal = ref<boolean>(false)
const editStyle = ref<'new' | 'edit'>('edit')
// Computed
const pages = computed<number[]>(() => {
  const maxPage = Math.ceil(totalCount.value / size.value)
  const pages = []
  for (let i = 1; i <= maxPage; i++) {
    pages.push(i)
  }
  return pages
})

// Watchers
watch(() => currentPage.value, fetchPlayers, { immediate: true })

// Functions
async function fetchPlayers(): Promise<void> {
  try {
    const response = await axios.get(
      `${apiUrl}/player/admin/list?offset=${(currentPage.value - 1) * size.value}&size=${size.value}`,
      {
        withCredentials: true,
      },
    )
    if (response.data) {
      const [playersResults, count] = response.data
      totalCount.value = count
      players.value = playersResults
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.code && err.code === '401') {
        $toast.error("Vous n'avez pas les droits requis")
        handleDisconnect()
      }
    }
  }
}
function onPlayerClicked(player: any): void {
  editStyle.value = 'edit'
  playerToEdit.value = player
  editModal.value = true
}
function handleNewPlayer(): void {
  editStyle.value = 'new'
  playerToEdit.value = emptyPlayer
  editModal.value = true
}
</script>

<style lang="scss" scoped>
.player-administration {
  @include admin-section;
  position: relative;
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
    &_pagination {
      display: flex;
      gap: 0.5rem;
      width: 100%;
      justify-content: center;
      & .selected {
        color: $second-color;
        background-color: $main-color;
      }
    }
  }
  &_add {
    @include green-button;
    width: fit-content;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
