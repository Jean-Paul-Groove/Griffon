<template>
  <section class="friend-list">
    <h2>Amis</h2>
    <div class="friend-list_container">
      <p v-if="friends.length === 0">Vous n'avez aucun ami pour le moment ...</p>
      <template v-else>
        <ul class="friend-list_container_list">
          <li v-for="friend of friends" :key="friend.id" class="friend-list_container_list_item">
            <FriendCard :friend="friend" />
          </li>
        </ul>
      </template>
    </div>
  </section>
  <section>
    <h2>Messagerie</h2>
    <ChatThread />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores'
import type { PlayerInfoDto } from 'shared'
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { apiUrl } from '../../helpers'
import FriendCard from './FriendCard.vue'
import { ChatThread } from '../ChatThread'

// Stores
const { user } = storeToRefs(useAuthStore())

// Refs
const friends = ref<Array<PlayerInfoDto & { online: boolean }>>([
  { ...user.value, online: true, room: 'qsddqqsd' },
])

// Hooks
onMounted(() => {
  if (user.value?.friends?.length) {
    void fetchFriendsInfo()
  }
})

// Functions
async function fetchFriendsInfo(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/player/friends')
    if (response.data) {
      friends.value = response.data
    }
  } catch (err) {
    console.log(err)
  }
}
</script>

<style lang="scss" scoped>
.friend-list {
  width: 100%;
  max-width: 600px;
  & h2 {
    text-align: center;
  }
  &_container {
    @include white-card;
    width: 100%;
    &_list {
      list-style: none;
      width: 100%;
      &_item {
        width: 100%;
      }
    }
  }
}
</style>
