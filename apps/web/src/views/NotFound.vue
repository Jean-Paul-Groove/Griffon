<template>
  <div class="not-found">
    <h2>Cette page n'existe pas</h2>
    <button to="-1" class="not-found_back" @click="$router.back()">Retour</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const $router = useRouter()
</script>

<style lang="scss" scoped>
.not-found {
  padding-top: 10%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  gap: 5rem;
  color: $secondary-color;
  font-size: 2rem;
  width: 100%;
  height: 100%;
  &_back {
    padding: 0.5rem 1rem;
    background-color: white;
    color: $main-color;
    border-radius: 0.3rem;
    box-shadow: $light-shadow;
    text-decoration: none;
    &:hover {
      box-shadow: none;
    }
  }
}
</style>
