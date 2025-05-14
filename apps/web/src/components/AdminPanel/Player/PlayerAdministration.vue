<template>
  <section class="player-administration">
    <h3>Players</h3>

    <TableDisplay :headers="headers" :elements="players" :row-click="onPlayerClicked" />
    <nav aria-label="pagination">
      <button
        v-for="page in pages"
        :key="page"
        :class="{ selected: currentPage === page }"
        @click="currentPage = page"
      >
        {{ page }}
      </button>
    </nav>
    <EditPlayerModal
      v-if="playerToEdit && editModal"
      :player="playerToEdit"
      @close="editModal = false"
      @confirm="fetchPlayers"
    />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../../../stores'
import { DetailedPlayerDto, UserRole } from 'shared'
import { apiUrl } from '../../../helpers'
import axios from 'axios'
import TableDisplay from '../../Table/TableDisplay.vue'
import EditPlayerModal from './EditPlayerModal.vue'

// Store
const authStore = useAuthStore()
const { user, token } = storeToRefs(useAuthStore())
const { resetToken } = authStore
// Constants
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Avatar', key: 'avatar' },
  { title: 'Role', key: 'role' },
  { title: 'Salon', key: 'room' },
]
// Refs
const players = ref<DetailedPlayerDto[]>([])
const totalCount = ref<number>(0)
const currentPage = ref<number>(1)
const size = ref<number>(10)
const playerToEdit = ref<DetailedPlayerDto>()
const editModal = ref<boolean>(false)

// Computed
const pages = computed<number[]>(() => {
  const maxPage = Math.ceil(totalCount.value / size.value)
  const pages = []
  for (let i = 1; i <= maxPage; i++) {
    pages.push(i)
  }
  return pages
})
// Hooks
onMounted(() => {
  if (!user.value || user.value.role !== UserRole.ADMIN) {
    resetToken()
    return
  }
})

// Watchers
watch(() => currentPage.value, fetchPlayers, { immediate: true })

// Functions
async function fetchPlayers(): Promise<void> {
  try {
    const response = await axios.get(
      `${apiUrl}/player/admin/list?offset=${(currentPage.value - 1) * size.value}&size=${size.value}`,
      {
        headers: { Authorization: 'bearer ' + token.value },
      },
    )
    if (response.data) {
      const [playersResults, count] = response.data
      totalCount.value = count
      players.value = playersResults
    }
  } catch (err) {
    console.log(err)
  }
}
function onPlayerClicked(player: any): void {
  playerToEdit.value = player
  editModal.value = true
}
</script>

<style lang="scss" scoped>
.player-administration {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  & nav {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    justify-content: center;
    & .selected {
      color: white;
      background-color: $main-color;
    }
  }
}
</style>
