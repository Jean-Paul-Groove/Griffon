<template>
  <div class="login-form">
    <div class="login-form_tabs">
      <div
        :class="{ active: activeTab === 'guest' }"
        class="login-form_tabs_tab"
        @click="activeTab = 'guest'"
      >
        Invité
      </div>
      <div
        :class="{ active: activeTab === 'connexion' }"
        class="login-form_tabs_tab"
        @click="activeTab = 'connexion'"
      >
        Connexion
      </div>
    </div>
    <form v-if="activeTab === 'guest'" class="login-form_guest">
      <FormInput v-model="guestName" label="Pseudo" :error="guestNameErrors != null" />
      <button class="login-form_button" @click="signIn">Continuer comme invité</button>
      <p v-if="guestNameErrors && !user">{{ guestNameErrors }}</p>
    </form>
    <form v-else class="login-form_user">
      <FormInput v-model="username" :error="userNameError != null" label="Pseudo" />
      <FormInput
        v-model="password"
        type="password"
        :error="passwordError != null"
        label="Mot de passe"
      />
      <button class="login-form_button">Connexion</button>
      <p v-if="userNameError && !user">{{ userNameError }}</p>
      <p v-if="passwordError && !user">{{ passwordError }}</p>

      <RouterLink class="login-form_link" to="/subscribe">Pas de compte ? S'inscrire !</RouterLink>
    </form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores'
import axios from 'axios'
import FormInput from '../form/FormInput.vue'
import { RouterLink } from 'vue-router'

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
const activeTab = ref<'guest' | 'connexion'>('guest')
// Computeds
const guestNameErrors = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return guestName.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
})
const userNameError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return username.value.trim() === '' ? 'Veuiller entrer mot de passe' : null
})
const passwordError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return password.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
})
// Watchers
watch(
  () => activeTab.value,
  () => {
    checkForErrors.value = false
  },
)

// Functions
async function signIn(e: Event): Promise<void> {
  try {
    e.preventDefault()
    checkForErrors.value = true
    if (guestName.value.length > 0 && guestNameErrors.value === null) {
      const response = await axios.post(apiUrl + '/auth/guest', { username: guestName.value })
      const jwt = response?.data?.access_token
      checkForErrors.value = false
      console.log(jwt)
      if (jwt) {
        setToken(jwt)
      }
    }
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="scss" scoped>
.login-form {
  margin-top: 2rem;
  display: flex;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: var(--light-shadow);
  background-color: white;
  position: relative;
  color: var(--main-color);
  &_button {
    color: white;
    background-color: var(--main-color);
    &:hover {
      box-shadow: none;
    }
  }
  &_tabs {
    position: absolute;
    top: -2rem;
    left: 0;
    height: 2rem;
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0 0.5rem;

    &_tab {
      background-color: white;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.3rem;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      border: 0.05rem solid rgba(211, 211, 211, 0);
      border-bottom: none;
      color: var(--main-color);
      background-color: rgb(245, 245, 240);
      width: 100%;
      cursor: pointer;
      &:hover,
      &.active {
        border-color: lightgray;
        background-color: white;
      }
    }
  }
  & form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  &_link {
    color: var(--main-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
