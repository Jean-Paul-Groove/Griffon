<template>
  <section class="friend-list">
    <h2>Amis</h2>
    <div class="friend-list_container">
      <p v-if="friends.length === 0">Vous n'avez aucun ami pour le moment ...</p>
      <template v-else>
        <ul class="friend-list_container_list">
          <li v-for="friend of friends" :key="friend.id" class="friend-list_container_list_item">
            <FriendCard
              :friend="friend"
              :with-actions="true"
              @join="handleJoin"
              @message="emit('conversation', friend)"
            />
          </li>
        </ul>
      </template>
    </div>
  </section>
  <section v-if="friendRequests.length > 0" class="friend-request">
    <h2>Demande d'ami</h2>
    <div class="friend-request_container">
      <p v-if="friendRequests.length === 0">Vous n'avez aucune demande en attente</p>
      <template v-else>
        <ul class="friend-request_container_list">
          <li
            v-for="request of friendRequests"
            :key="request.id"
            class="friend-list_container_list_item"
          >
            <FriendRequest
              :request="request"
              @accept="acceptRequest(request)"
              @refuse="rejectRequest(request)"
            />
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSocketStore } from '../../stores'
import { PendingRequestDto, WSE, type PlayerInfoDto } from 'shared'
import { onMounted, ref } from 'vue'
import FriendCard from './FriendCard.vue'
import { apiUrl } from '../../helpers'
import axios from 'axios'
import FriendRequest from './FriendRequest.vue'
import { useToast } from '../../composables/useToast'

const emit = defineEmits<{ (e: 'conversation', friend: PlayerInfoDto): void }>()

// Composables
const $toast = useToast()

// Stores
const socketStore = useSocketStore()
const { socket, friends } = storeToRefs(socketStore)
const { askFriendsInfo } = socketStore

// Refs
const friendRequests = ref<PendingRequestDto[]>([])
// Hooks
onMounted(() => {
  askFriendsInfo()
  void fetchPendingRequest()
})

// Functions
function handleJoin(roomId: string): void {
  if (socket.value) {
    socket.value.emit(WSE.ASK_JOIN_ROOM, { roomId })
  }
}
async function fetchPendingRequest(): Promise<void> {
  try {
    const response = await axios.get(apiUrl + '/player/friend-requests', {
      withCredentials: true,
    })
    if (response.data) {
      friendRequests.value = response.data
    }
  } catch (err) {
    console.log(err)
  }
}
async function acceptRequest(request: PendingRequestDto): Promise<void> {
  try {
    const response = await axios.post(
      apiUrl + '/player/accept-request',
      { requestId: request.id },
      {
        withCredentials: true,
      },
    )
    if (response.data) {
      friendRequests.value = response.data
    }
    $toast.success('Vous êtes maintenant ami avec ' + request.sender.name)
  } catch (err) {
    console.log(err)
  }
}

async function rejectRequest(request: PendingRequestDto): Promise<void> {
  try {
    const response = await axios.post(
      apiUrl + '/player/reject-request',
      { requestId: request.id },
      {
        withCredentials: true,
      },
    )
    if (response.data) {
      friendRequests.value = response.data
    }
    $toast.info('Demande rejetée')
  } catch (err) {
    console.log(err)
  }
}
</script>

<style lang="scss" scoped>
.friend-list {
  width: 100%;
  max-width: 600px;
  height: 100%;
  overflow-y: auto;
  & h2 {
    text-align: center;
  }
  &_container {
    @include white-card;
    width: 100%;
    &_list {
      width: 100%;
      &_item {
        width: 100%;
      }
    }
  }
}
.friend-request {
  width: 100%;
  max-width: 600px;
  height: 100%;
  overflow-y: auto;
  & h2 {
    text-align: center;
  }
  &_container {
    @include white-card;
    width: 100%;
    &_list {
      width: 100%;
      &_item {
        width: 100%;
      }
    }
  }
}
</style>
