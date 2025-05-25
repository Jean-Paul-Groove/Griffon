<template>
  <a :aria-label="'Lancer ' + game.title">
    <figure class="game-card">
      <img
        class="game-card_illustration"
        :src="img ?? getImageUrl(game.illustration, false)"
        :alt="game.title"
      />
      <figcaption class="game-card_text">
        <p class="game-card_text_title">{{ game.title }}</p>
        <p class="game-card_tooltip">{{ game.description }}</p>
      </figcaption>
    </figure>
  </a>
</template>

<script setup lang="ts">
import { getImageUrl } from '../../helpers/avatars'

defineProps<{
  game: { id: string; illustration: string; title: string; description: string; rules: string }
  img?: string
}>()
</script>

<style lang="scss" scoped>
.game-card {
  @include white-card;
  width: 100%;
  flex-direction: column;
  width: 200px;
  height: 180px;
  text-align: center;
  transform: scale(0.98);
  cursor: pointer;
  &:hover {
    transform: scale(1);
  }
  &_illustration {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
