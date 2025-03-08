<template>
  <DefaultLayout>
    <div v-if="breakPoint === 'laptop'" class="room-layout laptop">
      <PlayerList />
      <RouterView class="room-layout_router laptop" />
      <ChatThread />
    </div>
    <div v-else class="room-layout">
      <RouterView class="room-layout_router" />

      <div class="room-layout_conbined-view">
        <div class="room-layout_conbined-view_button-container">
          <button :class="{ selected: view === 'players' }" @click="view = 'players'">
            <FontAwesomeIcon icon="trophy" />
          </button>
          <button :class="{ selected: view === 'chat' }" @click="view = 'chat'">
            <FontAwesomeIcon icon="comment" />
          </button>
        </div>
        <PlayerList v-if="view === 'players'" /> <ChatThread v-if="view === 'chat'" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
import { ChatThread, PlayerList } from '@/components'
import { useLayoutSize } from '../stores'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const { breakPoint } = storeToRefs(useLayoutSize())
const view = ref<'players' | 'chat'>('chat')
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
    border: solid 0.1rem var(--main-color);
    border-left-width: 0px;
    border-right-width: 0px;
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
        background-color: var(--main-color);
        color: white;
      }
    }
  }
}
</style>
