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
      <FormInput v-model="email" :error="emailError != null" label="Email" />
      <FormInput
        v-model="password"
        type="password"
        :error="passwordError != null"
        label="Mot de passe"
      />
      <button class="login-form_button" @click="login">Connexion</button>
      <div class="login-form_errors">
        <p v-if="emailError && !user">{{ emailError }}</p>
        <p v-if="passwordError && !user">{{ passwordError }}</p>
      </div>

      <RouterLink class="login-form_link" to="/register">Pas de compte ? S'inscrire !</RouterLink>
    </form>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores'
import axios, { AxiosError } from 'axios'
import FormInput from '../form/FormInput.vue'
import { RouterLink, useRoute } from 'vue-router'
import { useToast } from '../../composables/useToast'

// Composables
const { user } = storeToRefs(useAuthStore())
const { setToken } = useAuthStore()
const $toast = useToast()
const $route = useRoute()
// Constants
const apiUrl = import.meta.env.VITE_API_ADDRESS
const tabs = ['guest', 'connexion']
//Refs
const checkForErrors = ref(false)
const email = ref<string>('')
const password = ref<string>('')
const guestName = ref<string>('')
const activeTab = ref<'guest' | 'connexion'>(
  tabs.includes($route.query.tab as string) ? ($route.query.tab as any) : 'guest',
)
// Computeds
const guestNameErrors = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return guestName.value.trim() === '' ? 'Veuiller entrer un email valide' : null
})
const emailError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return email.value.trim() === '' ? 'Veuiller entrer mot de passe' : null
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
    if (error instanceof AxiosError) {
      if (error.code == '400') {
        $toast.error('Ces identifiants sont invalides')
        email.value = ''
        password.value = ''
        checkForErrors.value = false
        return
      }
    }
    $toast.error('Connexion impossible...')
  }
}
async function login(e: Event): Promise<void> {
  try {
    e.preventDefault()
    checkForErrors.value = true
    if (emailError.value === null && passwordError.value === null) {
      const response = await axios.post(apiUrl + '/auth/login', {
        email: email.value,
        password: password.value,
      })
      const jwt = response?.data?.access_token
      checkForErrors.value = false
      if (jwt) {
        setToken(jwt)
      }
    }
  } catch {
    $toast.error('Connexion impossible')
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
  &_errors {
    display: flex;
    flex-direction: column;
    color: var(--secondary-color);
    gap: 0.3rem;
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
