<template>
  <div class="lobby">
    <section v-if="isAdmin" class="lobby_pick-game">
      <GamePicker />
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSocketStore } from '../stores'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { WSE } from 'shared'
import GamePicker from '../components/GamePicker/GamePicker.vue'

// Stores
const socketStore = useSocketStore()
const { isAdmin, socket, room } = storeToRefs(socketStore)

// Composables
const $route = useRoute()
const $router = useRouter()

// Hooks
onMounted(() => {
  const { roomId } = $route.params
  if (!roomId && !room.value?.id) {
    $router.replace({ name: 'Accueil' })
  } else {
    if (roomId && roomId != room.value?.id && socket.value)
      socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
})
</script>

<style scoped lang="scss">
.lobby {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 2rem;
  color: $main-color;
  overflow-y: auto;
  &_invitation {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }
  &_pick-game {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    &_selection {
      width: 100%;
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: center;
    }
  }
}
section {
  width: 100%;
}
</style>
