<template>
  <div :class="{ countdown: countDown }">{{ countDown }}</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSocketStore } from '../../stores'

const { countDown } = storeToRefs(useSocketStore())
</script>

<style lang="scss">
.countdown {
  color: $secondary-color;
  font-weight: bolder;
  font-size: large;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto 0;
  height: 70%;
  aspect-ratio: 1;
  padding: 0.1rem;
  background-color: white;
  border-radius: 100%;
  border: 1px solid $secondary-color;
}
</style>
