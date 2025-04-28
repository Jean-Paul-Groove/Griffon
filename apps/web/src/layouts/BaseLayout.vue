<template>
  <DefaultLayout>
    <RouterView class="base-layout_router" />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
onMounted(() => console.log('INSIDE BASE LAYOUT'))
</script>

<style lang="scss" scoped>
.base-layout_router {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
</style>
