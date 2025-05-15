<template>
  <DefaultLayout>
    <ConfirmModal v-if="disconnectModal" @confirm="onDisconnect" @close="disconnectModal = false"
      >Êtes vous sûr de vouloir vous déconnecter ?
    </ConfirmModal>
    <template #header-end>
      <button
        v-if="user"
        class="user-layout_disconnect"
        title="Déconnexion"
        aria-label="Se déconnecter"
        @click="disconnectModal = true"
      >
        <FontAwesomeIcon class="user-layout_disconnect_icon" :icon="['fas', 'user-xmark']" />
      </button>
    </template>

    <RouterView class="user-layout_router" />
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from './components/DefaultLayout.vue'
import { RouterView } from 'vue-router'
import { useAuthStore, useSocketStore } from '../stores'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ConfirmModal from '../components/ConfirmModal/ConfirmModal.vue'

// Composables
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { handleDisconnect } = useSocketStore()
// Refs
const disconnectModal = ref<boolean>(false)

// Functions
function onDisconnect(): void {
  disconnectModal.value = false
  handleDisconnect()
}
</script>

<style lang="scss" scoped>
.user-layout {
  &_router {
    padding-top: 2rem;
    padding-bottom: 2rem;
    max-height: 100%;
    overflow-y: auto;
  }
  &_disconnect {
    position: absolute;
    right: 5%;
    top: 0.1rem;
    padding: 0.3rem;
    max-height: 3rem;
    height: 70%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    @include danger-button;
  }
}
</style>
