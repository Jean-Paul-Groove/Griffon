<template>
  <ul v-if="room && room.players" class="player-list">
    <li v-for="player in room.players" :key="player.id">
      <PlayerCard
        :player="player"
        :is-admin="player.id === room.admin"
        :is-current-player="player.id === currentPlayer?.id"
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
// Refs
const { room, currentPlayer } = storeToRefs(useSocketStore())

// Watchers

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
