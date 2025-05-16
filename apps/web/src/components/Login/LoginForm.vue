<template>
  <div class="login-form">
    <div class="login-form_tabs" role="tablist">
      <button
        id="tab-1"
        :class="{ active: activeTab === 'guest' }"
        role="tab"
        :aria-selected="activeTab === 'guest'"
        tabindex="0"
        aria-controls="panel-guest"
        class="login-form_tabs_tab"
        @click="activeTab = 'guest'"
      >
        Invité
      </button>
      <button
        id="tab-2"
        :class="{ active: activeTab === 'connexion' }"
        class="login-form_tabs_tab"
        role="tab"
        :aria-selected="activeTab === 'connexion'"
        tabindex="1"
        aria-controls="panel-connetion"
        @click="activeTab = 'connexion'"
      >
        Connexion
      </button>
    </div>
    <div
      id="panel-guest"
      aria-labelledby="tab-1"
      role="tabpanel"
      :class="{ visible: activeTab === 'guest' }"
      class="login-form_panel"
    >
      <form class="login-form_guest">
        <FormInput
          v-model="guestName"
          input-id="guest-name"
          label="Pseudo"
          :error="guestNameErrors != null"
        />
        <button class="login-form_button" @click="signIn">Continuer comme invité</button>
        <p v-if="guestNameErrors && !user">{{ guestNameErrors }}</p>
      </form>
    </div>
    <div
      id="panel-connetion"
      aria-labelledby="tab-2"
      role="tabpanel"
      :class="{ visible: activeTab === 'connexion' }"
      class="login-form_panel"
    >
      <form class="login-form_user">
        <FormInput
          v-model="email"
          input-id="user-email"
          :error="emailError != null"
          label="Email"
        />
        <FormInput
          v-model="password"
          input-id="user-password"
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
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore, useSocketStore } from '../../stores'
import axios, { AxiosError } from 'axios'
import FormInput from '../form/FormInput.vue'
import { RouterLink, useRoute } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { apiUrl } from '../../helpers'

// Composables
const { user } = storeToRefs(useAuthStore())
const { allowReconnect } = useSocketStore()
const $toast = useToast()
const $route = useRoute()
// Constants
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
  return guestName.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
})
const emailError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return email.value.trim() === '' ? 'Veuiller entrer email' : null
})
const passwordError = computed<null | string>(() => {
  if (!checkForErrors.value) {
    return null
  }
  return password.value.trim() === '' ? 'Veuillez entrer un mot de passe' : null
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
      await axios.post(
        apiUrl + '/auth/guest',
        { username: guestName.value },
        { withCredentials: true },
      )
      checkForErrors.value = false
      allowReconnect()
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code == '401') {
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
      await axios.post(
        apiUrl + '/auth/login',
        {
          email: email.value,
          password: password.value,
        },
        { withCredentials: true },
      )

      allowReconnect()
    }
  } catch {
    $toast.error('Connexion impossible')
  }
}
</script>

<style lang="scss" scoped>
.login-form {
  @include white-card;
  color: $main-color;
  margin-top: 2rem;
  position: relative;
  &_button {
    color: $main-color;
    background-color: $second-color;
    &:hover {
      box-shadow: none;
    }
  }
  &_errors {
    display: flex;
    flex-direction: column;
    color: $danger-color;
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
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.3rem;
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
      border: 0.05rem solid rgba(211, 211, 211, 0);
      border-bottom: none;
      color: $main-color;
      background-color: rgb(245, 245, 240);
      width: 100%;
      cursor: pointer;
      box-shadow: none;
      &:hover,
      &.active {
        border-color: lightgray;
        background-color: white;
      }
    }
  }
  &_panel {
    display: none;
    &.visible {
      display: contents;
    }
  }
  & form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  &_link {
    color: $main-color;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
