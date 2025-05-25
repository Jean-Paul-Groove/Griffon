<template>
  <header class="header">
    <slot name="header-start" />
    <img class="header_logo" :src="logo" alt="Griphon-logo" />
    <h1 class="header_title">{{ $route.name }}</h1>
    <slot name="header-end" />
  </header>
</template>

<script setup lang="ts">
import logo from '../../assets/logos/logo-basic.webp'
import { useRoute } from 'vue-router'

const $route = useRoute()
</script>
<style lang="scss" scoped>
.header {
  aspect-ratio: 10;
  display: flex;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background: url('../../assets/background/header-scroll.webp') center/cover no-repeat;
  padding: 0 3%;
  z-index: 10;
  &_logo {
    height: 55%;
    max-height: 100%;
    width: auto;
  }
  &_title {
    font-size: 2.5vw;
  }
}
@media screen and (min-width: 700px) {
  .header {
    aspect-ratio: 20;
    &_title {
      font-size: 1.5vw;
    }
  }
}
</style>
