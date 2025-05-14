<template>
  <teleport to="#modal">
    <div class="edit-player-modal_wrapper">
      <div class="edit-player-modal_content">
        <ConfirmModal v-if="deleteModal" @close="deleteModal = false" @confirm="handleDelete"
          >Êtes vous sûr de vouloir supprimer définitivement {{ player.name }} ?</ConfirmModal
        >
        <ButtonIcon
          class="edit-player-modal_content_delete"
          icon="trash"
          text="Supprimer l'utilisateur"
          :selected="false"
          @click="deleteModal = true"
        />
        <form class="edit-player-form">
          <FormInput
            v-model="editedPlayer.name"
            input-id="edit-player-name"
            :error="errors.name != null"
            label="Pseudo"
          />
          <template v-if="player.role !== UserRole.GUEST">
            <FormInput
              v-model="editedPlayer.email"
              input-id="edit-player-email"
              type="email"
              :error="errors.email != null"
              label="Email"
            />
            <FormInput
              v-model="password"
              input-id="edit-player-password"
              type="password"
              :error="errors.password != null"
              label="Mot de passe"
            />
            <FormInput
              v-model="confirmPassword"
              input-id="edit-player-confirm-password"
              type="password"
              :error="errors.confirmPassword != null"
              label="Confirmation"
            />
            <label>
              Role
              <select v-model="editedPlayer.role">
                <option>{{ UserRole.REGISTERED_USER }}</option>
                <option>{{ UserRole.ADMIN }}</option>
              </select>
            </label>
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
                @click="handleDeleteFile"
              >
                <FontAwesomeIcon icon="xmark" />
              </button>
            </label>
            <img
              v-if="fileUrl"
              class="edit-player-form_avatar-preview"
              :src="fileUrl"
              alt="Avatar"
            />
          </template>
          <div class="edit-player-form_errors">
            <p
              v-for="(error, index) of errors"
              :key="index"
              :style="{ display: error ? 'initial' : 'none' }"
            >
              {{ error }}
            </p>
          </div>
        </form>
        <div class="edit-player-modal_buttons">
          <button class="edit-player-modal_buttons_confirm" @click="editPlayer">Ok</button>
          <button class="edit-player-modal_buttons_cancel" @click="emit('close')">Annuler</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserRole, type DetailedPlayerDto } from 'shared'
import defaultAvatar from '../../../assets/avatar/default-avatar.webp'
import { apiUrl } from '../../../helpers'
import FormInput from '../../form/FormInput.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import axios, { AxiosError } from 'axios'
import { useToast } from '../../../composables/useToast'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../../stores'
import ButtonIcon from '../../ButtonIcon/ButtonIcon.vue'
import ConfirmModal from '../../ConfirmModal/ConfirmModal.vue'

const props = defineProps<{ player: DetailedPlayerDto }>()
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

// Types
interface SignInErrors {
  name: null | string
  password: null | string
  confirmPassword: null | string
  email: null | string
  file: null | string
}

// Stores
const { token } = storeToRefs(useAuthStore())

// Composables
const $toast = useToast()

// Constants
const strongPasswordPattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[#?!@$%^&*-]).{8,}$/
const emailPattern = /^[a-zà-ú-.]+@([\w-]+\.)+[\w-]{2,4}$/
const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
//Refs
const checkForErrors = ref(false)
const password = ref<string>('')
const confirmPassword = ref<string>('')
const file = ref<File | null>(null)
const editedPlayer = ref<DetailedPlayerDto>({ ...props.player })
const deleteModal = ref<boolean>(false)
// Computeds
const errors = computed<SignInErrors>(() => {
  const errorObject: SignInErrors = {
    name: null,
    password: null,
    confirmPassword: null,
    email: null,
    file: null,
  }
  if (checkForErrors.value === false) {
    return errorObject
  }
  errorObject.name =
    editedPlayer.value.name.trim() === '' ? 'Veuiller entrer un pseudo valide' : null
  if (editedPlayer.value.role === UserRole.GUEST) {
    errorObject.password = null
    errorObject.confirmPassword = null
    errorObject.email = null
    errorObject.file = null
  } else {
    errorObject.password =
      strongPasswordPattern.test(password.value) || password.value.length === 0
        ? null
        : 'Le mot de passe doit comporter 8 charactères, 1 majuscule, 1 minuscule et 1 charactère spécial'
    errorObject.confirmPassword =
      password.value === confirmPassword.value ? null : 'Les mots de passe ne sont pas identiques'

    errorObject.email = emailPattern.test(editedPlayer.value.email)
      ? null
      : 'Veuillez entrer une adresse valide'

    errorObject.file =
      file.value && !acceptedTypes.includes(file.value.type)
        ? "Ce type de fichier n'est pas accepté"
        : null
  }

  return errorObject
})
const fileUrl = computed<string | null>(() => {
  if (file.value === null) {
    if (editedPlayer.value.avatar) {
      return apiUrl + '/' + editedPlayer.value.avatar
    }
    return defaultAvatar
  }
  return URL.createObjectURL(file.value)
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

async function editPlayer(e: Event): Promise<void> {
  try {
    e.preventDefault()
    checkForErrors.value = true
    if (Object.values(errors.value).filter((error) => error != null).length === 0) {
      if (file.value) {
        const formData = new FormData()
        if (editedPlayer.value.role === UserRole.GUEST) {
          $toast.error("Un invité ne peut pas avoir d'avatar")
          return
        }
        formData.append('role', editedPlayer.value.role)
        formData.append('avatar', file.value || '')
        formData.append('name', editedPlayer.value.name)
        formData.append('id', editedPlayer.value.id)
        formData.append('email', editedPlayer.value.email)
        if (password.value.length > 0) {
          formData.append('password', password.value)
        }

        await axios.patch(apiUrl + '/player/admin/edit_f', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'bearer ' + token.value,
          },
        })
      } else {
        const data: Partial<DetailedPlayerDto> & { password?: string } = {
          id: editedPlayer.value.id,
          name: editedPlayer.value.name,
          role: editedPlayer.value.role,
          email: editedPlayer.value.email,
        }
        if (password.value.length > 0) {
          data.password = password.value
        }
        await axios.patch(apiUrl + '/player/admin/edit', data, {
          headers: { Authorization: 'bearer ' + token.value },
        })
      }
      $toast.success('Joueur édité avec succès !')
      emit('confirm')
      emit('close')
    }
  } catch (err: any) {
    if (err instanceof AxiosError) {
      if (err.response?.data?.message && err.response?.data?.message === 'Email already used') {
        $toast.error('Cet email est déjà utilisé')
      }
    }
    $toast.error("L'opération a échoué")
  }
}

async function handleDelete(): Promise<void> {
  try {
    await axios.delete(apiUrl + '/player/admin/?id=' + props.player.id, {
      headers: { Authorization: 'bearer ' + token.value },
    })

    $toast.success('Joueur supprimé avec succès !')
    emit('confirm')
    emit('close')
  } catch {
    $toast.error("L'opération a échoué")
  }
}
</script>

<style scoped lang="scss">
.edit-player-modal {
  &_wrapper {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.377);
    display: flex;
    justify-content: center;
    z-index: 10;
    padding: 1rem;
    padding-top: 15%;
  }
  &_content {
    height: fit-content;
    min-width: 15rem;
    background-color: white;
    border-radius: 1rem;
    display: flex;
    padding: 1rem;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
    max-height: 80%;
    overflow-y: auto;
    &_delete {
      @include danger-button;
      width: fit-content;
      margin-left: auto;
    }
  }
  &_buttons {
    width: 100%;
    display: flex;
    gap: 1rem;
    &_confirm {
      @include green-button;
    }
    &_cancel {
      @include danger-button;
    }
    & button {
      width: 100%;
    }
  }
}
.edit-player-form {
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
    max-width: 3rem;
    aspect-ratio: 1;
    border-radius: 100%;
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
