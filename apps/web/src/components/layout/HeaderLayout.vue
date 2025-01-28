<template>
  <div class="header">
    <img class="header_logo" :src="logo" alt="Griphon" />
    <img class="header_logo" :src="titleLogo" alt="Griphon" />
  </div>
</template>

<script setup lang="ts">
import logo from '../../assets/logos/logo-basic.webp'
import titleLogo from '../../assets/logos/griffon-title.webp'
</script>
<style lang="scss" scoped>
.header {
  display: flex;
  width: 100%;
  aspect-ratio: 20;
  justify-content: center;
  align-items: center;
  background: url('../../assets/background/header-scroll.webp') center/cover no-repeat;
  &_logo {
    display: block;
    height: 70%;
  }
}
</style>
