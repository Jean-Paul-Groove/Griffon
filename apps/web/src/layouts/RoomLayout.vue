<template>
  <DefaultLayout>
    <div class="room-layout">
      <RouterView class="room-layout_router" />
      <hr class="room-page_separator" />
      <ChatThread />
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
import { ChatThread } from '@/components'
</script>

<style lang="scss" scoped>
.room-layout {
  gap: 5px;
  padding: 10px;
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
    grid-template-columns: (calc(70% - 16px) 1px 30%);
    grid-template-rows: 1fr;
    &_separator {
      border-left: solid 1px rgb(255, 157, 0);
    }
  }
}
@media (orientation: portrait) {
  .room-layout {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: (calc(70% - 20px) 1px 30%);
    &_separator {
      border-top: solid 1px rgb(255, 157, 0);
    }
  }
}
</style>
