<template>
  <a class="game-card">
    <figure>
      <img class="game-card_illustration" :src="game.illustration" :alt="game.title" />
      <figcaption class="game-card_text">
        <p class="game-card_text_title">{{ game.title }}</p>
      </figcaption>
      <p class="game-card_tooltip">{{ game.description }}</p>
    </figure>
  </a>
</template>

<script setup lang="ts">
import type { GameSpecs } from './types/gameSpecs'

defineProps<{ game: GameSpecs }>()
</script>

<style lang="scss" scoped>
.game-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 180px;
  box-shadow: $light-shadow;
  padding: 1rem;
  text-align: center;
  background-color: white;
  border-radius: 0.4rem;
  transform: scale(0.98);
  cursor: pointer;
  &:hover {
    transform: scale(1);
  }
  &_illustration {
    width: 100%;
  }
  &_tooltip {
    display: none;
  }
  &:hover &_tooltip {
    position: fixed;
    display: initial;
    bottom: -3rem;
    left: 0;
    right: 0;
    padding: 1rem 0.5rem;
    background-color: black;
    border-radius: 0.5rem;
    color: white;
  }
}
</style>
