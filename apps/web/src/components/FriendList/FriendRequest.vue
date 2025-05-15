<template>
  <article class="friend-request">
    <div class="friend-request_info">
      <img
        class="friend-request_img"
        :src="getImageUrl(request.sender.avatar)"
        :alt="request.sender.name"
      />
      <p class="friend-request_name">{{ request.sender.name }}</p>
    </div>
    <div class="friend-request_actions">
      <ButtonIcon
        class="add"
        icon="plus"
        text="Accepter"
        :selected="false"
        @click="emit('accept')"
      />
      <ButtonIcon
        class="remove"
        icon="minus"
        text="Refuser"
        :selected="false"
        @click="emit('refuse')"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { PendingRequestDto } from 'shared'
import ButtonIcon from '../ButtonIcon/ButtonIcon.vue'
import { getImageUrl } from '../../helpers/avatars'

defineProps<{ request: PendingRequestDto }>()
const emit = defineEmits<{
  (e: 'accept'): void
  (e: 'refuse'): void
}>()
</script>

<style scoped lang="scss">
.friend-request {
  @include player-card;
  width: 100%;
  display: flex;
  &_info {
    height: 100%;
    max-height: 3rem;
    display: flex;
    gap: 1rem;
    margin-right: 1rem;
    align-items: center;
    justify-content: space-between;
    width: 50%;
  }
  &_img {
    max-height: 3rem;
    @include avatar;
  }
  &_actions {
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
    & .add {
      @include green-button;
    }
    & .remove {
      @include danger-button;
    }
  }
}
</style>
