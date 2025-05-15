<template>
  <teleport to="#modal">
    <div class="edit-player-modal_wrapper">
      <div class="edit-player-modal_content">
        <ConfirmModal v-if="deleteModal" @close="deleteModal = false" @confirm="handleDelete"
          >Êtes vous sûr de vouloir supprimer définitivement {{ player.name }} ?</ConfirmModal
        >
        <ButtonIcon
          v-if="editStyle === 'edit'"
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
            <label class="edit-player-form_avatar" for="avatar-input">
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
                class="edit-player-form_avatar_remove"
                title="Supprimer le fichier"
                aria-label="Supprimer le fichier"
                @click="handleDeleteFile"
              >
                <FontAwesomeIcon icon="xmark" />
              </button>
            </label>
            <img
              v-if="fileUrl"
              class="edit-player-form_avatar_preview"
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
          <button class="edit-player-modal_buttons_confirm" @click="handleConfirm">Ok</button>
          <button class="edit-player-modal_buttons_cancel" @click="emit('close')">Annuler</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { emailPattern, strongPasswordPattern, UserRole, type DetailedPlayerDto } from 'shared'
import { apiUrl } from '../../../helpers'
import FormInput from '../../form/FormInput.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import axios, { AxiosError } from 'axios'
import { useToast } from '../../../composables/useToast'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../../stores'
import ButtonIcon from '../../ButtonIcon/ButtonIcon.vue'
import ConfirmModal from '../../ConfirmModal/ConfirmModal.vue'
import { getImageUrl } from '../../../helpers/avatars'

const props = defineProps<{ player: DetailedPlayerDto; editStyle: 'new' | 'edit' }>()
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
      strongPasswordPattern.test(password.value) ||
      (props.editStyle === 'edit' && password.value.length === 0)
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
    return getImageUrl(editedPlayer.value.avatar)
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

async function handleConfirm(e: Event): Promise<void> {
  try {
    console.log('HEYo')
    e.preventDefault()
    checkForErrors.value = true
    if (Object.values(errors.value).filter((error) => error != null).length === 0) {
      const formData = new FormData()
      // Add ID if in edit mode
      if (props.editStyle === 'edit') {
        formData.append('id', editedPlayer.value.id)
      }

      formData.append('name', editedPlayer.value.name)

      if (editedPlayer.value.role !== UserRole.GUEST) {
        // Add fields for registered_users
        formData.append('role', editedPlayer.value.role)
        if (editedPlayer.value.email.length > 0) {
          formData.append('email', editedPlayer.value.email)
        }

        if (password.value.length > 0 || props.editStyle === 'new') {
          formData.append('password', password.value)
        }
        if (file.value) {
          formData.append('avatar', file.value)
        }
      } else {
        if (props.editStyle === 'new') {
          $toast.error('You can not create a guest player')
          return
        }
      }
      console.log('ADDED EVERYTHING')
      console.log(formData)

      // Post or Patch according to edit mode
      if (props.editStyle === 'edit') {
        await axios.patch(apiUrl + '/player/admin/edit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'bearer ' + token.value,
          },
        })
        $toast.success('Joueur édité avec succès !')
      } else {
        await axios.post(apiUrl + '/player/admin/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'bearer ' + token.value,
          },
        })
        $toast.success('Joueur créé avec succès !')
      }
      emit('confirm')
      emit('close')
    }
  } catch (err: unknown) {
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
    @include white-card;
    height: fit-content;
    min-width: 15rem;
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
  @include white-card;
  flex-direction: column;
  max-width: 30rem;
  margin: auto;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  position: relative;
  color: $main-color;
  height: fit-content;
  &_errors {
    display: flex;
    flex-direction: column;
    color: $danger-color;
    gap: 0.3rem;
  }
  &_button {
    color: $second-color;
    background-color: $main-color;
    &:hover {
      box-shadow: none;
    }
  }
  &_avatar {
    &_remove {
      @include danger-button;
    }
    &_preview {
      @include avatar;
    }
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
