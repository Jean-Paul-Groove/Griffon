<template>
  <div class="player-card" @click="handleClick">
    <div class="player-card_info">
      <span class="player-card_info_name">
        <FontAwesomeIcon v-if="isAdmin" icon="crown" />
        {{ player.name }}
      </span>
      <span class="player-card_info_points">{{
        `${getUserPoints(player.id)?.points ?? 0} points`
      }}</span>
    </div>
    <p class="player-card_tag">
      <img v-if="player.isArtist" :src="pen" alt="artist-pen" />
    </p>
    <button
      v-if="currentPlayerAdmin && optionDisplayed && !isAdmin"
      title="Exclure ce joueur"
      class="player-card_exclude"
      @click="handleExclude"
    >
      <FontAwesomeIcon icon="user-xmark" />
    </button>
    <ConfirmModal
      v-if="excludeModal"
      @close="excludeModal = false"
      @confirm="excludePlayer(player.id)"
      >Voulez-vous vraiment exclure ce joueur ?
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import type { PlayerInfoDto } from 'shared'
import pen from '@/assets/logos/pen.webp'
import { useSocketStore } from '../../stores'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import ConfirmModal from '../ConfirmModal/ConfirmModal.vue'
interface PlayerCardProp {
  player: PlayerInfoDto
  isAdmin: boolean
  isCurrentPlayer: boolean
}
const { getUserPoints, excludePlayer } = useSocketStore()
const { isAdmin: currentPlayerAdmin } = storeToRefs(useSocketStore())
defineProps<PlayerCardProp>()

// Refs
const optionDisplayed = ref<boolean>(false)
const excludeModal = ref<boolean>(false)

// Functions
function handleClick(): void {
  if (currentPlayerAdmin.value) {
    optionDisplayed.value = !optionDisplayed.value
  }
}
function handleExclude(e: Event): void {
  e.stopPropagation()
  excludeModal.value = true
}
</script>

<style lang="scss" scoped>
.player-card {
  width: 100%;
  display: flex;
  gap: 0.1rem;
  padding: 0.2rem 0.4rem;
  align-items: center;
  background-color: white;
  border-radius: 0.3rem;
  height: 2rem;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.486);
  cursor: pointer;
  transform: scale(0.99);
  &:hover {
    transform: scale(1);
    transition: scale 0.3s linear;
  }
  &_tag {
    width: 2rem;
    & img {
      width: 100%;
    }
  }
  &_info {
    width: 100%;
    display: flex;
    gap: 0.2rem;
    justify-content: space-between;
  }
  &_exclude {
    height: 90%;
    padding: 0.2rem;
    color: var(--secondary-color);
    box-shadow: none;
    &:hover {
      background-color: var(--secondary-color);
      color: white;
    }
  }
}
</style>
