<template>
  <teleport to="#modal">
    <div class="confirm-modal_wrapper">
      <div class="confirm-modal_content">
        <slot></slot>
        <div class="confirm-modal_buttons">
          <button class="confirm-modal_buttons_confirm" @click="handleConfirm">Ok</button>
          <button class="confirm-modal_buttons_cancel" @click="emit('close')">Annuler</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

// Functions
function handleConfirm(): void {
  emit('confirm')
  emit('close')
}
</script>

<style scoped lang="scss">
.confirm-modal {
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
  }
  &_buttons {
    width: 100%;
    display: flex;
    gap: 1rem;
    &_cancel {
      @include danger-button;
    }
    &_confirm {
      @include green-button;
    }
    & button {
      width: 100%;
    }
  }
}
</style>
