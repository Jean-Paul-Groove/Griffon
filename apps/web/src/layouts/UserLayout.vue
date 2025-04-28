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
  gap: 0.2rem;
  padding: 0.4rem;
  max-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: (60% 40%);
  grid-template-columns: 1fr;
  &_router {
    max-height: 100%;
    overflow-y: auto;
    margin-top: 2rem;
  }
  &_disconnect {
    position: absolute;
    right: 5%;
    top: 0.1rem;
    color: var(--secondary-color);
    padding: 0.3rem;
    max-height: 3rem;
    height: 70%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      color: white;
      background-color: var(--secondary-color);
    }
  }
}

.user-layout.laptop {
  grid-template-columns: (20% 60% 20%);
  grid-template-rows: 1fr;
}
.user-layout_router.laptop {
  border-left-width: 0.1rem;
  border-right-width: 0.1rem;
  border-top-width: 0px;
  border-bottom-width: 0px;
}
.user-layout_conbined-view {
  position: relative;
  height: 100%;
  display: flex;
  width: 100%;
  justify-content: center;
  &_button-container {
    position: absolute;
    display: flex;
    gap: 0.5rem;
    left: 0.5rem;
    top: -2.5rem;
    button {
      &.selected {
        background-color: var(--main-color);
        color: white;
      }
    }
  }
}
</style>
