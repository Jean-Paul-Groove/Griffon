<template>
  <div>
    <form class="sign-in-form">
      <FormInput v-model="username" :error="errors.username != null" label="Pseudo" />
      <FormInput
        v-model="password"
        type="password"
        :error="errors.password != null"
        label="Mot de passe"
      />
      <FormInput
        v-model="confirmPassword"
        type="password"
        :error="errors.confirmPassword != null"
        label="Confirmation"
      />
      <FormInput v-model="email" type="email" :error="errors.email != null" label="Email" />
      <label for="avatar-input">
        Avatar:
        <input
          id="avatar-input"
          type="file"
          accept="image/jpg,image/jpeg, image/png,image/webp"
          capture
          @change="onFileChanged"
        />
        <button v-if="file" title="Supprimer le fichier" @click="handleDeleteFile">
          <FontAwesomeIcon icon="xmark" />
        </button>
      </label>
      <button class="sign-in-form_button" @click="registerUser">Inscription</button>
      <DividerText color="$main-color" text-color="$main-color" text="Aperçu" />
      <PlayerCard :player="playerInfo" :is-admin="false" :is-current-player="true" />
      <div class="sign-in-form_errors">
        <p
          v-for="(error, index) of errors"
          :key="index"
          :style="{ display: error ? 'initial' : 'none' }"
        >
          {{ error }}
        </p>
      </div>

      <RouterLink class="sign-in-form_link" to="/login">Déjà inscrit ? Connectez vous !</RouterLink>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import axios, { AxiosError } from 'axios'
import FormInput from '../components/form/FormInput.vue'
import { RouterLink, useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import PlayerCard from '../components/PlayerList/PlayerCard.vue'
import { PlayerInfoDto, UserRole } from 'shared'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import DividerText from '../components/Divider/DividerText.vue'
import { apiUrl } from '../helpers'
// Types
interface SignInErrors {
  username: null | string
  password: null | string
  confirmPassword: null | string
  email: null | string
  file: null | string
}
// Composables
const $toast = useToast()
const $router = useRouter()

// Constants
const strongPasswordPattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[#?!@$%^&*-]).{8,}$/
const emailPattern = /^[a-zà-ú-.]+@([\w-]+\.)+[\w-]{2,4}$/
const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
//Refs
const checkForErrors = ref(false)
const username = ref<string>('')
const password = ref<string>('')
const confirmPassword = ref<string>('')
const email = ref<string>('')
const file = ref<File | null>(null)
// Computeds
const errors = computed<SignInErrors>(() => {
  const errorObject: SignInErrors = {
    username: null,
    password: null,
    confirmPassword: null,
    email: null,
    file: null,
  }
  if (checkForErrors.value === false) {
    return errorObject
  }
  errorObject.username = username.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
  errorObject.password = strongPasswordPattern.test(password.value)
    ? null
    : 'Votre mot de passe doit comporter 8 charactères, 1 majuscule, 1 minuscule et 1 charactère spécial'
  errorObject.confirmPassword =
    password.value === confirmPassword.value ? null : 'Les mots de passe ne sont pas identiques'

  errorObject.email = emailPattern.test(email.value) ? null : 'Veuillez entrer une adresse valide'

  errorObject.file =
    file.value && !acceptedTypes.includes(file.value.type)
      ? "Ce type de fichier n'est pas accepté"
      : null

  return errorObject
})
const fileUrl = computed<string | null>(() => {
  if (file.value === null) {
    return null
  }
  return URL.createObjectURL(file.value)
})
const playerInfo = computed<PlayerInfoDto>(() => {
  return new PlayerInfoDto({
    id: 'preview',
    avatar: fileUrl.value || '',
    isArtist: false,
    role: UserRole.REGISTERED_USER,
    name: username.value,
  })
})
// Functions
function onFileChanged(e: Event): void {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFile = target.files[0]
    if (newFile) {
      if (newFile.size / (1024 * 1024) <= 5) {
        file.value = newFile
      } else {
        $toast.error('Votre image est trop volumineuse: 5mo max')
      }
    }
  }
}
function handleDeleteFile(e: Event): void {
  e.preventDefault()
  file.value = null
}
async function registerUser(e: Event): Promise<void> {
  try {
    e.preventDefault()
    checkForErrors.value = true
    if (Object.values(errors.value).filter((error) => error != null).length === 0) {
      if (file.value) {
        const formData = new FormData()
        formData.append('avatar', file.value || '')
        formData.append('username', username.value)
        formData.append('email', email.value)
        formData.append('password', password.value)

        await axios.post(apiUrl + '/auth/register_f', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        await axios.post(apiUrl + '/auth/register', {
          username: username.value,
          password: password.value,
          email: email.value,
        })
        $toast.success('Bienvenue chez les Griffoneurs !')
      }
      $router.push('/?tab=connexion')
    }
  } catch (err: any) {
    if (err instanceof AxiosError) {
      if (err.response?.data?.message && err.response?.data?.message === 'Email already used') {
        $toast.error('Cet email est déjà utilisé')
      }
    }
    $toast.error("Nous n'avons pas pu vous inscrire :(  ")
  }
}
</script>

<style lang="scss" scoped>
.sign-in-form {
  display: flex;
  flex-direction: column;
  max-width: 30rem;
  margin: auto;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: $light-shadow;
  background-color: white;
  position: relative;
  color: $main-color;
  height: fit-content;
  &_errors {
    display: flex;
    flex-direction: column;
    color: $secondary-color;
    gap: 0.3rem;
  }
  &_button {
    color: white;
    background-color: $main-color;
    &:hover {
      box-shadow: none;
    }
  }
  &_avatar-preview {
    max-width: 50%;
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
