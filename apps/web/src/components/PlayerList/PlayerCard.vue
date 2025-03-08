<template>
  <div class="player-card">
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
  </div>
</template>

<script setup lang="ts">
import type { PlayerInfoDto } from 'shared'
import pen from '@/assets/logos/pen.webp'
import { useSocketStore } from '../../stores'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
interface PlayerCardProp {
  player: PlayerInfoDto
  isAdmin: boolean
  isCurrentPlayer: boolean
}
const { getUserPoints } = useSocketStore()
defineProps<PlayerCardProp>()

// Computed
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
  transform: scale(0.99);
  &:hover {
    transform: scale(1);
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
}
</style>
