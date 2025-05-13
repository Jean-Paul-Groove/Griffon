<template>
  <article class="friend-card" :class="{ disconnected: !friend.online }">
    <div class="friend-card_info">
      <img class="friend-card_img" :src="avatar" :alt="friend.name" />
      <p class="friend-card_name">{{ friend.name }}</p>
      <p v-if="friend.room && friend.online" class="friend-card_status connected">Dans un salon</p>
      <template v-else>
        <p v-if="friend.online" class="friend-card_status connected">Connecté</p>
        <p v-else class="friend-card_status">Hors ligne</p>
      </template>
    </div>
    <div class="friend-card_actions">
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
  </article>
</template>

<script setup lang="ts">
import type { PlayerInfoDto } from 'shared'
import { computed } from 'vue'
import { apiUrl } from '../../helpers'
import defaultAvatar from '../../assets/avatar/default-avatar.webp'
import ButtonIcon from '../ButtonIcon/ButtonIcon.vue'

const props = defineProps<{ friend: PlayerInfoDto & { online: boolean } }>()
const emit = defineEmits<{
  (e: 'join', roomId: string): void
  (e: 'message', playerId: string): void
}>()
const avatar = computed<string>(() => {
  return props.friend.avatar ? apiUrl + '/' + props.friend.avatar : defaultAvatar
})
</script>

<style lang="scss" scoped>
.friend-card {
  @include player-card;
  &_info {
    height: 100%;
    display: flex;
    gap: 1rem;
    margin-right: 1rem;
    align-items: center;
    justify-content: space-between;
    width: 50%;
  }
  &_img {
    @include avatar;
  }
  &_status {
    margin-left: auto;
    color: #5c5c5c;
    &.connected {
      color: green;
    }
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
