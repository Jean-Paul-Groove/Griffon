<template>
  <div class="layout">
    <HeaderLayout class="layout_header">
      <template #header-start>
        <slot name="header-start" />
      </template>
      <template #header-end>
        <slot name="header-end" />
      </template>
    </HeaderLayout>
    <main class="layout_main">
      <slot></slot>
    </main>
    <FooterLayout class="layout_footer" />
  </div>
</template>

<script setup lang="ts">
import HeaderLayout from './HeaderLayout.vue'
import FooterLayout from './FooterLayout.vue'
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;
  max-height: 100vh;
  background: url('../../assets/background/body-scroll.webp');
  background-size: 100vw 100vh;
  position: relative;
  overflow: hidden;
  width: 100%;
  &_header {
    position: absolute;
    top: calc(-1 * $scrolls-height * 0.1);
    left: 0;
    right: 0;
  }
  &_footer {
    position: absolute;
    bottom: calc(-1 * $scrolls-height/3);
    left: 0;
    right: 0;
  }
  &_main {
    padding-top: calc($scrolls-height * 0.85);
    padding-bottom: calc($scrolls-height * 0.1);
    padding-left: 4vw;
    padding-right: 4vw;
    max-height: 100%;
    height: 100%;
    width: 100%;
  }
}
@media screen and (min-width: 700px) {
  .layout_main {
    padding-top: calc($scrolls-height / 2 * 0.7);
  }
}
</style>
