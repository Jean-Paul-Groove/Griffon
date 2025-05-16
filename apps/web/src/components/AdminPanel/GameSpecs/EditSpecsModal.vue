<template>
  <teleport to="#modal">
    <div class="edit-specs-modal_wrapper">
      <div class="edit-specs-modal_content">
        <form ref="form" class="edit-specs-form">
          <p class="edit-specs-form_title">{{ editedGame.title }}</p>
          <label for="edit-specs-description">
            Description
            <textarea id="edit-specs-description" v-model="editedGame.description"></textarea>
          </label>
          <label for="edit-specs-description">
            Règles
            <textarea id="edit-specs-description" v-model="editedGame.rules"></textarea>
          </label>
          <FormInput
            v-model="editedGame.defaultRoundDuration"
            input-id="edit-specs-duration"
            :error="errors.duration != null"
            label="Durée du tour"
            type="number"
          />
          <FormInput
            v-model="editedGame.pointStep"
            input-id="edit-specs-points-step"
            :error="errors.pointStep != null"
            label="Différence de points"
            type="number"
          />
          <FormInput
            v-model="editedGame.pointsMax"
            input-id="edit-specs-points-max"
            :error="errors.pointsMax != null"
            label="Points maximum"
            type="number"
          />
          <label class="edit-specs-form_illustration" for="illustration-input">
            Illustration:
            <input
              id="illustration-input"
              type="file"
              accept="image/jpg,image/jpeg, image/png,image/webp"
              capture
              @change="onFileChanged"
            />
            <button
              v-if="file"
              class="edit-specs-form_illustration_remove"
              title="Supprimer le fichier"
              aria-label="Supprimer le fichier"
              @click="handleDeleteFile"
            >
              <FontAwesomeIcon icon="xmark" />
            </button>
          </label>
          <div class="edit-specs-form_errors">
            <p
              v-for="(error, index) of errors"
              :key="index"
              :style="{ display: error ? 'initial' : 'none' }"
            >
              {{ error }}
            </p>
          </div>
        </form>
        <p>Aperçu</p>
        <GameCard :game="editedGame" :img="fileUrl ?? undefined" />
        <div class="edit-specs-modal_buttons">
          <button class="edit-specs-modal_buttons_confirm" @click="handleConfirm">Ok</button>
          <button class="edit-specs-modal_buttons_cancel" @click="emit('close')">Annuler</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiUrl } from '../../../helpers'
import FormInput from '../../form/FormInput.vue'
import axios from 'axios'
import { useToast } from '../../../composables/useToast'
import type { GameSpecs } from '../../GameCard/types/gameSpecs'
import GameCard from '../../GameCard/GameCard.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps<{ game: GameSpecs }>()
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

// Types
interface EditSpecsError {
  description: null | string
  rules: null | string
  duration: null | string
  pointStep: null | string
  pointsMax: null | string
  file: null | string
}

// Composables
const $toast = useToast()

// Constants
const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
//Refs
const checkForErrors = ref(false)
const file = ref<File | null>(null)
const editedGame = ref({
  id: props.game.id,
  title: props.game.title,
  description: props.game.description,
  rules: props.game.rules,
  defaultRoundDuration: props.game.defaultRoundDuration.toString(),
  pointStep: props.game.pointStep.toString(),
  pointsMax: props.game.pointsMax.toString(),
  illustration: props.game.illustration,
})
const form = ref()
// Computeds
const errors = computed<EditSpecsError>(() => {
  const errorObject: EditSpecsError = {
    description: null,
    rules: null,
    duration: null,
    pointStep: null,
    pointsMax: null,
    file: null,
  }
  if (checkForErrors.value === false) {
    return errorObject
  }
  errorObject.description =
    editedGame.value.description.trim() === '' ? 'Veuiller entrer une description' : null

  errorObject.duration =
    +editedGame.value.defaultRoundDuration <= 0 ? 'Veuiller entrer une durée positive' : null

  errorObject.pointStep =
    +editedGame.value.pointStep <= 0 ? 'Veuiller entrer une différence de points positive' : null

  errorObject.pointsMax =
    +editedGame.value.pointsMax <= +editedGame.value.pointStep
      ? 'Veuiller entrer maximum de points supérieur à la différence de points'
      : null

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

// Hooks
onMounted(() => {
  form.value.focus()
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
    e.preventDefault()
    checkForErrors.value = true
    if (Object.values(errors.value).filter((error) => error != null).length === 0) {
      const formData = new FormData()
      if (file.value) {
        formData.append('illustration', file.value)
      }
      formData.append('description', editedGame.value.description)
      formData.append('id', editedGame.value.id)
      formData.append('rules', editedGame.value.rules)
      formData.append(
        'defaultRoundDuration',
        (+editedGame.value.defaultRoundDuration * 1000).toString(),
      )
      formData.append('pointStep', editedGame.value.pointStep)
      formData.append('pointsMax', editedGame.value.pointsMax)

      await axios.patch(apiUrl + '/game/admin/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })
      $toast.success('Jeu édité avec succès !')
      emit('confirm')
      emit('close')
    }
  } catch {
    $toast.error("L'opération a échoué")
  }
}
</script>

<style scoped lang="scss">
.edit-specs-modal {
  &_wrapper {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.377);
    display: flex;
    justify-content: center;
    z-index: 10;
    padding: 1rem;
    padding-top: 5%;
  }
  &_content {
    @include white-card;
    height: fit-content;
    width: 40rem;
    max-width: 100%;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    max-height: 95%;
    overflow-y: auto;
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
.edit-specs-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: auto;
  justify-content: center;
  align-items: center;
  gap: 0.7rem;
  padding: 2rem;
  padding-bottom: 0;
  position: relative;
  color: $main-color;
  height: fit-content;
  &_title {
    font-size: 2rem;
  }
  & label {
    display: flex;
    flex-direction: column;
    width: 100%;
    & textarea {
      min-height: 5rem;
    }
  }
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
  &_illustration {
    display: flex;
    gap: 0.5rem;
    flex-direction: row !important;
    justify-content: space-between;
    align-items: center;
    border: 0.2rem solid $second-color;
    border-radius: 0.5rem;
    padding: 0.3rem;
    &_remove {
      @include danger-button;
      width: fit-content;
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
