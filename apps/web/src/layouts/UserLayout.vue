<template>
  <DefaultLayout>
    <ConfirmModal
      v-if="disconnectModal"
      @confirm="handleDisconnect"
      @close="disconnectModal = false"
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
import { useAuthStore } from '../stores'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ConfirmModal from '../components/ConfirmModal/ConfirmModal.vue'

// Composables
const { user } = storeToRefs(useAuthStore())
const { resetToken } = useAuthStore()

// Refs
const disconnectModal = ref<boolean>(false)

// Functions
function handleDisconnect(): void {
  resetToken()
  disconnectModal.value = false
}
</script>

<style lang="scss" scoped>
.user-layout {
  &_router {
    margin-top: 2rem;
    margin-bottom: 2rem;
    padding-top: 1.5rem;
    padding-bottom: 2rem;
    max-height: 100%;
    overflow-y: auto;
  }
  &_disconnect {
    position: absolute;
    right: 5%;
    top: 0.1rem;
    color: $secondary-color;
    padding: 0.3rem;
    max-height: 3rem;
    height: 70%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      color: white;
      background-color: $secondary-color;
    }
  }
}
</style>
