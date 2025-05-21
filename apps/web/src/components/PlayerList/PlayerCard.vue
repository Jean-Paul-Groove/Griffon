<template>
  <article class="player-card" @click="handleClick">
    <img
      class="player-card_avatar"
      :src="getImageUrl(player.avatar, alternativePicture)"
      alt="avatar"
    />
    <div class="player-card_info">
      <span class="player-card_info_name">
        <FontAwesomeIcon v-if="isAdmin" icon="crown" />
        {{ player.name }}
      </span>
      <span class="player-card_info_points">{{
        `${getUserPoints(player.id)?.points ?? 0} points`
      }}</span>
    </div>
    <p class="player-card_tag">
      <img v-if="player.isArtist" :src="pen" alt="artist-pen" />
    </p>
    <button
      v-if="currentPlayerAdmin && optionDisplayed && !isAdmin"
      :title="'Exclure ' + player.name"
      class="player-card_exclude"
      :aria-label="'Exclure ' + player.name"
      @click="handleExclude"
    >
      <FontAwesomeIcon icon="user-xmark" />
    </button>
    <button
      v-if="canAddAsFriend && optionDisplayed"
      title="Ajouter en ami"
      class="player-card_add"
      :aria-label="'Ajouter ' + player.name + ' en ami'"
      @click="handleAddFriend"
    >
      <FontAwesomeIcon icon="user-plus" />
    </button>
    <ConfirmModal
      v-if="excludeModal"
      @close="excludeModal = false"
      @confirm="confirmExcludePlayer(player.id)"
      >Voulez-vous vraiment exclure ce joueur ?
    </ConfirmModal>
    <ConfirmModal
      v-if="addFriendModal"
      @close="addFriendModal = false"
      @confirm="confirmAddFriend(player.id)"
      >Voulez-vous ajouter {{ player.name }} comme ami ?
    </ConfirmModal>
  </article>
</template>

<script setup lang="ts">
import { UserRole, type PlayerInfoDto } from 'shared'
import pen from '@/assets/logos/pen.webp'
import { useAuthStore, useSocketStore } from '../../stores'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import ConfirmModal from '../ConfirmModal/ConfirmModal.vue'
import { getImageUrl } from '../../helpers/avatars'
interface PlayerCardProp {
  player: PlayerInfoDto
  isAdmin: boolean
  isCurrentPlayer: boolean
  alternativePicture: string
}
const { getUserPoints, excludePlayer, addFriend } = useSocketStore()
const { isAdmin: currentPlayerAdmin } = storeToRefs(useSocketStore())
const { user } = storeToRefs(useAuthStore())
const props = defineProps<PlayerCardProp>()

// Refs
const optionDisplayed = ref<boolean>(false)
const excludeModal = ref<boolean>(false)
const addFriendModal = ref<boolean>(false)

const isFriend = computed<boolean>(() => {
  return user.value?.friends != null && user.value.friends.includes(props.player.id)
})

const canAddAsFriend = computed<boolean>(() => {
  return !isFriend.value && props.player.role !== UserRole.GUEST && !props.isCurrentPlayer
})

// Functions
function handleClick(): void {
  if (user.value?.role !== UserRole.GUEST) {
    optionDisplayed.value = !optionDisplayed.value
  }
}
function handleExclude(e: Event): void {
  e.stopPropagation()
  excludeModal.value = true
}
function handleAddFriend(e: Event): void {
  e.stopPropagation()
  addFriendModal.value = true
}
function confirmExcludePlayer(playerId: string): void {
  excludePlayer(playerId)
  excludeModal.value = false
}
function confirmAddFriend(playerId: string): void {
  addFriend(playerId)
  addFriendModal.value = false
}
</script>

<style lang="scss" scoped>
.player-card {
  @include player-card;
  transform: scale(0.99);
  max-width: 25rem;
  cursor: pointer;
  &_avatar {
    @include avatar;
  }
  &:hover {
    transform: scale(1);
    transition: scale 0.3s linear;
  }
  &_tag {
    width: 2rem;
    & img {
      width: 100%;
    }
  }
  &_info {
    width: 100%;
    display: flex;
    gap: 0.2rem;
    justify-content: space-between;
    &_name {
      text-align: center;
    }
  }
  &_exclude {
    height: 90%;
    padding: 0.2rem;
    box-shadow: none;
    @include danger-button;
  }
  &_add {
    height: 90%;
    padding: 0.2rem;
    box-shadow: none;
    @include green-button;
  }
}
</style>
