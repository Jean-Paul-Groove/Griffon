<template>
  <DefaultLayout>
    <ConfirmModal v-if="disconnectModal" @confirm="onDisconnect" @close="disconnectModal = false"
      >Êtes vous sûr de vouloir vous déconnecter ?
    </ConfirmModal>
    <template #header-end>
      <nav>
        <ButtonIcon
          v-if="user"
          class="user-layout_disconnect"
          icon="user-xmark"
          text="Déconnexion"
          :selected="true"
          @click="disconnectModal = true"
        ></ButtonIcon>
      </nav>
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
import ConfirmModal from '../components/ConfirmModal/ConfirmModal.vue'
import ButtonIcon from '../components/ButtonIcon/ButtonIcon.vue'

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
    @include danger-button;
    position: absolute;
    right: 5%;
    top: 0;
    padding-top: $scrolls-height * 0.15;
    max-height: $scrolls-height;
  }
}
@media screen and (min-width: 700px) {
  .user-layout_disconnect {
    max-height: $scrolls-height * 0.45;
  }
}
</style>
