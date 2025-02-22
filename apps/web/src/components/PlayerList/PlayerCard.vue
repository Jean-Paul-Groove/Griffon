<template>
  <div class="player-card">
    <p class="player-card_tag">{{ isAdmin ? '👑' : '' }}</p>
    <div class="player-card_info">
      <span class="player-card_info_name">
        {{ player.name }}
      </span>
      <span class="player-card_info_points">{{ `${player.points} points` }}</span>
    </div>
    <p class="player-card_tag">
      <img v-if="player.isDrawing" :src="pen" alt="artist-pen" />
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Player } from 'dto'
import pen from '@/assets/logos/pen.webp'
interface PlayerCardProp {
  player: Player
  isAdmin: boolean
  isCurrentUser: boolean
}
const props = defineProps<PlayerCardProp>()

// Computed
</script>

<style lang="scss" scoped>
.player-card {
  width: 100%;
  display: flex;
  gap: 0.1rem;
  padding: 0.1rem 0.4rem;
  &_tag {
    width: 2rem;
    & img {
      width: 100%;
    }
  }
  &_info {
    width: 100%;
    display: flex;
    justify-content: space-between;
    &_name {
      width: 100%;
      text-wrap: 'wrap';
    }
    &_points {
      width: 100%;
    }
  }
}
</style>
