<template>
  <section class="profile">
    <h2>Profile</h2>
    <figure class="profile_card">
      <img
        class="profile_card_avatar"
        :src="getImageUrl(user?.avatar, defaultAvatar)"
        :alt="user?.name"
      />
      <p class="profile_card_name">{{ user?.name }}</p>
    </figure>

    <form class="profile_edit-form">
      <p>Modifier votre profil</p>
      <FormInput
        v-model="name"
        input-id="register-username"
        :error="errors.name != null"
        label="Pseudo"
      />
      <FormInput
        v-model="password"
        input-id="register-password"
        type="password"
        :error="errors.password != null"
        label="Mot de passe"
      />
      <FormInput
        v-model="confirmPassword"
        input-id="register-confirm-password"
        type="password"
        :error="errors.confirmPassword != null"
        label="Confirmation"
      />

      <label for="avatar-input">
        Avatar:
        <input
          id="avatar-input"
          type="file"
          accept="image/jpg,image/jpeg, image/png,image/webp"
          capture
          @change="onFileChanged"
        />
        <button
          v-if="file"
          title="Supprimer le fichier"
          aria-label="Supprimer le fichier"
          class="profile_edit-form_avatar_remove"
          @click="handleDeleteFile"
        >
          <FontAwesomeIcon icon="xmark" />
        </button>
        <div v-if="fileUrl" class="profile_edit-form_avatar_preview_container">
          <img class="profile_edit-form_avatar_preview" :src="fileUrl" alt="avatar" />
        </div>
      </label>
      <button class="profile_edit-form_button" @click="editPlayer">Modifier</button>
      <div class="profile_edit-form_errors">
        <p
          v-for="(error, index) of errors"
          :key="index"
          :style="{ display: error ? 'initial' : 'none' }"
        >
          {{ error }}
        </p>
      </div>
    </form>
    <ButtonIcon
      class="profile_delete"
      icon="trash"
      text="Supprimer votre compte"
      :selected="false"
      @click="deleteModal = true"
    />
    <ConfirmModal v-if="deleteModal" @close="deleteModal = false" @confirm="handleDelete"
      >Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est définitive
      ...</ConfirmModal
    >
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore, useSocketStore } from '../../stores'
import { getImageUrl } from '../../helpers/avatars'
import FormInput from '../form/FormInput.vue'
import { computed, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import axios from 'axios'
import { apiUrl } from '../../helpers'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ButtonIcon from '../ButtonIcon/ButtonIcon.vue'
import ConfirmModal from '../ConfirmModal/ConfirmModal.vue'
import { strongPasswordPattern } from 'shared'
import defaultAvatar from '@/assets/avatar/default-avatar.webp'
// Stores
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { setPlayerInfo } = authStore
const { handleDisconnect } = useSocketStore()

// Types
interface SignInErrors {
  name: null | string
  password: null | string
  confirmPassword: null | string
  file: null | string
}
// Composables
const $toast = useToast()

// Constants
const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
//Refs
const checkForErrors = ref(false)
const name = ref<string>(user.value?.name as string)
const password = ref<string>()
const confirmPassword = ref<string>()
const file = ref<File | null>(null)
const deleteModal = ref<boolean>(false)
// Computeds
const errors = computed<SignInErrors>(() => {
  const errorObject: SignInErrors = {
    name: null,
    password: null,
    confirmPassword: null,
    file: null,
  }
  if (checkForErrors.value === false) {
    return errorObject
  }
  if (name.value.length) {
    errorObject.name = name.value.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
  }
  if (password.value?.length) {
    errorObject.password = strongPasswordPattern.test(password.value)
      ? null
      : 'Votre mot de passe doit comporter 8 charactères, 1 majuscule, 1 minuscule et 1 charactère spécial'
  }
  errorObject.confirmPassword =
    password.value === confirmPassword.value ? null : 'Les mots de passe ne sont pas identiques'

  errorObject.file =
    file.value && !acceptedTypes.includes(file.value.type)
      ? "Ce type de fichier n'est pas accepté"
      : null

  return errorObject
})
const fileUrl = computed<string>(() => {
  if (file.value === null) {
    return getImageUrl(user.value?.avatar, defaultAvatar)
  }
  return URL.createObjectURL(file.value)
})

// Functions
function onFileChanged(e: Event): void {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFile = target.files[0]
    // Size limit of 5mo
    if (newFile) {
      if (newFile.size / 1000000 <= 5) {
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
async function editPlayer(e: Event): Promise<void> {
  try {
    e.preventDefault()
    checkForErrors.value = true
    if (Object.values(errors.value).filter((error) => error != null).length === 0) {
      const formData = new FormData()
      if (file.value) {
        formData.append('avatar', file.value)
      }
      if (name.value.length) {
        formData.append('name', name.value)
      }
      if (password.value?.length) {
        formData.append('password', password.value)
      }
      const response = await axios.patch(apiUrl + '/player/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })
      if (response.data) {
        setPlayerInfo(response.data, true)
      }

      $toast.success('Votre profil a été modifié')
    }
  } catch {
    $toast.error('La modification a échouée ... ')
  }
}
async function handleDelete(): Promise<void> {
  try {
    await axios.delete(apiUrl + '/player/self', {
      withCredentials: true,
    })

    $toast.success('Votre compte a bien été supprimé')
    handleDisconnect()
  } catch {
    $toast.error("L'opération a échoué")
  }
}
</script>

<style lang="scss" scoped>
.profile {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  &_delete {
    @include danger-button;
  }
  &_card {
    display: flex;
    align-items: center;
    gap: 1rem;
    @include white-card;
    &_avatar {
      @include avatar;
    }
    &_name {
      font-size: xx-large;
    }
  }
  &_edit-form {
    @include white-card;
    flex-direction: column;
    gap: 0.7rem;
    align-items: center;
    &_avatar {
      &_remove {
        @include danger-button;
      }
      &_preview {
        @include avatar;
        &_container {
          display: flex;
          justify-content: center;
        }
      }
    }
  }
}
</style>
