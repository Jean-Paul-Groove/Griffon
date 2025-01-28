<template>
  <div>
    <HeaderLayout class="layout_header" />
    <main class="layout_main">
      <RouterView />
    </main>
    <FooterLayout class="layout_footer" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderLayout from './HeaderLayout.vue'
import FooterLayout from './FooterLayout.vue'
</script>

<style scoped lang="scss">
.layout {
  overflow-y: auto;
  &_header {
    margin-bottom: -2%;
    position: relative;
  }
  &_footer {
    margin-top: -2%;
    position: relative;
  }
  &_main {
    background: url('../../assets/background/body-scroll.webp') center/cover no-repeat;
    padding: calc(100vw / 20 * 0.8) 10%;
  }
}
</style>
