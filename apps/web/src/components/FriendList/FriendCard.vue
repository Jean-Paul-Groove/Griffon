<template>
  <figure class="friend-card" :class="{ disconnected: !friend.online }">
    <figcaption class="friend-card_info">
      <img
        class="friend-card_img"
        :src="getImageUrl(friend.avatar)"
        :alt="friend.name + ' ' + friend.online ? 'Connecté' : 'Déconnecté'"
      />
      <p class="friend-card_name">{{ friend.name }}</p>
    </figcaption>
    <div v-if="withActions" class="friend-card_actions">
      <ButtonIcon
        v-if="friend.room && friend.online"
        icon="dice"
        text="Rejoindre"
        :selected="false"
        @click="emit('join', friend.room)"
      />
      <ButtonIcon
        icon="comment"
        text="Message"
        :selected="false"
        @click="emit('message', friend.id)"
      />
    </div>
  </figure>
</template>

<script setup lang="ts">
import type { PlayerInfoDto } from 'shared'
import ButtonIcon from '../ButtonIcon/ButtonIcon.vue'
import { getImageUrl } from '../../helpers/avatars'

withDefaults(
  defineProps<{
    friend: Omit<PlayerInfoDto, 'isArtist'> & { online: boolean }
    withActions: boolean
  }>(),
  { withActions: true },
)
const emit = defineEmits<{
  (e: 'join', roomId: string): void
  (e: 'message', playerId: string): void
}>()
</script>

<style lang="scss" scoped>
.friend-card {
  @include player-card;
  width: fit-content;
  min-width: 7rem;
  &_info {
    height: 100%;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    min-width: fit-content;
  }
  &_img {
    @include avatar;
    margin-right: 0;
    border-color: green;
  }
  &_name {
    max-width: 3rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &_actions {
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
  }
  &.disconnected {
    background-color: #dbdbdb;
    & img {
      border-color: #5c5c5c;
    }
  }
}
</style>
