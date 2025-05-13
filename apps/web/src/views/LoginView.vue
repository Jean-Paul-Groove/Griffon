<template>
  <div class="login-view">
    <LoginForm />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import LoginForm from '../components/Login/LoginForm.vue'
import { useAuthStore } from '../stores'
import { useRouter } from 'vue-router'
import { watch } from 'vue'

// Stores
const { user } = storeToRefs(useAuthStore())

//Composables
const $router = useRouter()

// Watchers
watch(
  () => user.value,
  () => {
    if (user.value !== null) {
      $router.push({ name: 'Accueil' })
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 1rem;
}
</style>
