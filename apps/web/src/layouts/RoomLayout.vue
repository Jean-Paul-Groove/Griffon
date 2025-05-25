<template>
  <DefaultLayout>
    <ConfirmModal v-if="exitModal" @confirm="handleLeaveRoom" @close="exitModal = false"
      >Êtes vous sûr de vouloir quitter ce salon ?
    </ConfirmModal>
    <template #header-end>
      <CountDown />
      <nav>
        <ButtonIcon
          v-if="room"
          class="room-layout_disconnect"
          icon="door-open"
          text="Quitter le salon"
          :selected="true"
          @click="exitModal = true"
        ></ButtonIcon>
      </nav>
    </template>
    <template #header-start>
      <div
        class="room-layout_connexion-status"
        :class="{ connected: socket?.connected }"
        :title="socket?.connected ? 'Connecté' : 'Déconnecté'"
      />
    </template>
    <div v-if="breakPoint === 'laptop'" class="room-layout laptop">
      <PlayerList />
      <RouterView class="room-layout_router laptop" />
      <RoomChat />
    </div>
    <div v-else class="room-layout">
      <RouterView class="room-layout_router" />

      <div class="room-layout_conbined-view">
        <nav class="room-layout_conbined-view_button-container">
          <ButtonIcon
            icon="trophy"
            text="Joueurs"
            :selected="view === 'players'"
            @click="view = 'players'"
          />
          <ButtonIcon
            icon="comment"
            text="Chat"
            :selected="view === 'chat'"
            @click="view = 'chat'"
          />
        </nav>
        <PlayerList v-if="view === 'players'" /> <RoomChat v-if="view === 'chat'" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
import { PlayerList } from '@/components'
import { useLayoutStore, useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import ConfirmModal from '../components/ConfirmModal/ConfirmModal.vue'
import CountDown from '../components/CountDown/CountDown.vue'
import ButtonIcon from '../components/ButtonIcon/ButtonIcon.vue'
import RoomChat from '../components/RoomChat/RoomChat.vue'

// Composables
const socketStore = useSocketStore()
const { breakPoint } = storeToRefs(useLayoutStore())
const { room, socket } = storeToRefs(socketStore)
const { leaveRoom } = socketStore
// Refs
const view = ref<'players' | 'chat'>('chat')
const exitModal = ref<boolean>(false)

// Functions
function handleLeaveRoom(): void {
  leaveRoom()
  exitModal.value = false
}
</script>

<style lang="scss" scoped>
.room-layout {
  gap: 0.2rem;
  padding: 0.4rem;
  max-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: (60% 40%);
  grid-template-columns: 1fr;
  &_router {
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    border: solid 0 $main-color;
    border-bottom-width: 0.1rem;
  }
  &_disconnect {
    @include danger-button;
    position: absolute;
    right: 5%;
    top: 0;
    padding-top: $scrolls-height * 0.15;
    max-height: $scrolls-height;
  }
  &_connexion-status {
    height: 60%;
    aspect-ratio: 1;
    background-color: rgba(128, 128, 128, 0.584);
    position: absolute;
    left: 5%;
    border-radius: 100%;
    &.connected {
      background-color: rgba(34, 207, 34, 0.573);
      box-shadow: inset 1px 1px 5px rgba(0, 0, 0, 0.214);
    }
  }
}

.room-layout.laptop {
  grid-template-columns: (20% 60% 20%);
  grid-template-rows: 1fr;
}
.room-layout_router.laptop {
  border-left-width: 0.1rem;
  border-right-width: 0.1rem;
  border-top-width: 0px;
  border-bottom-width: 0px;
}
.room-layout_conbined-view {
  position: relative;
  height: 100%;
  display: flex;
  width: 100%;
  justify-content: center;
  &_button-container {
    position: absolute;
    display: flex;
    gap: 0.5rem;
    left: 0.5rem;
    top: -2.5rem;
    button {
      &.selected {
        background-color: $main-color;
        color: $second-color;
      }
    }
  }
}
@media screen and (min-width: 700px) {
  .room-layout_disconnect {
    max-height: $scrolls-height * 0.45;
  }
}
</style>
