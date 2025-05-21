<template>
  <ul v-if="room && room.players" class="player-list">
    <li v-for="player in sortedPlayers" :key="player.id">
      <PlayerCard
        :player="player"
        :is-admin="player.id === room.admin"
        :is-current-player="player.id === currentPlayer?.id"
        :alternative-picture="defaultAvatar"
      />
    </li>
    <li><InvitePlayer v-if="!room.currentGame && room.players.length < room.limit" /></li>
  </ul>
</template>

<script setup lang="ts">
import { useSocketStore } from '../../stores'
import { storeToRefs } from 'pinia'
import PlayerCard from './PlayerCard.vue'
import InvitePlayer from './InvitePlayer.vue'
import defaultAvatar from '../../assets/avatar/default-avatar.webp'
import { PlayerInfoDto } from 'shared'
import { computed } from 'vue'

// Refs
const { room, currentPlayer } = storeToRefs(useSocketStore())
const { getPlayerPoints } = useSocketStore()
// Computeds
const sortedPlayers = computed<PlayerInfoDto[]>(() => {
  if (!room.value) {
    return []
  }
  return [...room.value.players].sort(
    (pa, pb) => (getPlayerPoints(pb.id)?.points ?? 0) - (getPlayerPoints(pa.id)?.points ?? 0),
  )
})

// Functions
</script>

<style lang="scss" scoped>
.player-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  max-width: 25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
