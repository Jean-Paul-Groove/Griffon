<template>
  <div class="login-form">
    <form class="login-form_guest">
      <div>Continuer en tant qu'invité</div>
      <FormInput v-model="guestName" :error="guestName != null" label="Pseudo" />
      <button @click="signIn">Connexion en tant qu'invité</button>
      <p v-if="usernameError && !user">{{ usernameError }}</p>
    </form>
    <form class="login-form_user">
      <div>Connexion</div>
      <FormInput v-model="username" :error="usernameError != null" label="Pseudo" />
      <FormInput
        v-model="password"
        type="password"
        :error="usernameError != null"
        label="Mot de passe"
      />
      <button @click="signIn">Connexion en tant qu'invité</button>
      <p v-if="usernameError && !user">{{ usernameError }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores'
import axios from 'axios'
import FormInput from '../form/FormInput.vue'

// Composables
const { user } = storeToRefs(useAuthStore())
const { setToken } = useAuthStore()

// Constants
const apiUrl = import.meta.env.VITE_API_ADDRESS

//Refs
const checkForErrors = ref(false)
const username = ref<string>('')
const password = ref<string>('')
const guestName = ref<string>('')

// Computeds
const usernameError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return username.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
})

// Functions
async function signIn(): Promise<void> {
  try {
    checkForErrors.value = true
    if (username.value.length > 0) {
      const response = await axios.post(apiUrl + '/auth/guest', { username: username.value })
      const jwt = response?.data?.access_token
      checkForErrors.value = false
      if (jwt) {
        setToken(jwt)
      }
    }
  } catch (error) {
    console.log(error)
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  padding: 1rem;
  border: 0.3rem var(--main-color) solid;
  border-radius: 0.5rem;
  gap: 2rem;
  & form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
