<template>
  <main class="layout">
    <HeaderLayout class="layout_header" />
    <main class="layout_main">
      <RouterView class="layout_main_router" />
    </main>
    <FooterLayout class="layout_footer" />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderLayout from './HeaderLayout.vue'
import FooterLayout from './FooterLayout.vue'
</script>

<style scoped lang="scss">
$scrolls-height: calc(100vw / 20);
.layout {
  height: calc(100vh - $scrolls-height);
  margin-top: $scrolls-height/2;
  margin-bottom: $scrolls-height/2;
  background: url('../../assets/background/body-scroll.webp');
  background-size: 100vw 100vh;
  position: relative;
  &_header {
    position: absolute;
    top: -$scrolls-height/2;
    left: 0;
    right: 0;
  }
  &_footer {
    position: absolute;
    bottom: -$scrolls-height/2;
    left: 0;
    right: 0;
  }
  &_main {
    padding: $scrolls-height/2 7vw;
    max-height: 100%;
    height: 100%;
    &_router {
      height: 100%;
      max-height: 100%;
      overflow: hidden;
    }
  }
}
</style>
