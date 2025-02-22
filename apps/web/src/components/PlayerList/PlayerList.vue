<template>
  <div>
    <ul v-if="room && room.players" class="player-list">
      <li v-for="player in room.players" :key="player.id">
        <PlayerCard
          :player="player"
          :is-admin="player.id === room.owner"
          :is-current-user="player.id === currentPlayer?.id"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from '../../stores'
import { storeToRefs } from 'pinia'
import PlayerCard from './PlayerCard.vue'

// Stores
const socketStore = useSocketStore()
// Refs
const { room, player: currentPlayer } = storeToRefs(socketStore)

// Watchers

// Functions
</script>

<style lang="scss" scoped>
.player-list {
  list-style: none;
}
</style>
