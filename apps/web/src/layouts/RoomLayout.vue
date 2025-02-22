<template>
  <DefaultLayout :transition="false">
    <div class="room-layout">
      <PlayerList />
      <RouterView class="room-layout_router" />
      <ChatThread />
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
import { ChatThread, PlayerList } from '@/components'
</script>

<style lang="scss" scoped>
.room-layout {
  gap: 0.2rem;
  padding: 0.4rem;
  max-height: 100%;
  height: 100%;
  &_separator {
    height: 100%;
    width: 100%;
    border: none;
  }
  &_router {
    height: 100%;
    max-height: 100%;
    overflow: hidden;
  }
}
@media (orientation: landscape) {
  .room-layout {
    display: grid;
    grid-template-columns: (20% 60% 20%);
    grid-template-rows: 1fr;
    &_router {
      border-left: solid 0.2rem var(--main-color);
      border-right: solid 0.2rem var(--main-color);
    }
  }
}
@media (orientation: portrait) {
  .room-layout {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: (20% 60% 20%);
    &_router {
      border-top: solid 0.1rem var(--main-color);
      border-bottom: solid 0.1rem var(--main-color);
    }
  }
}
</style>
