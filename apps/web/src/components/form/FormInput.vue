<template>
  <label :for="inputId" class="form-input">
    <input
      :id="inputId"
      v-model="model"
      class="form-input_input"
      :class="{ error: error }"
      :type="type"
      placeholder="   "
    />
    <span class="form-input_label">{{ label }} </span>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<string>()

withDefaults(defineProps<{ inputId: string; label?: string; error?: boolean; type?: string }>(), {
  type: 'text',
  label: '',
})
</script>

<style lang="scss" scoped>
.form-input {
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  outline: none;
  border-radius: 1rem;
  position: relative;
  height: 3rem;
  justify-content: flex-end;
  width: 100%;
  color: $main-color;
  &_input {
    background-color: rgba(255, 255, 255, 0.686);
    outline: none;
    border-radius: 0.3rem;
    padding: 0 0.5rem;
    height: 1.5rem;
    width: 100%;
    text-align: center;
    border: 0.1rem solid lightgray;
    &:focus {
      outline: 0.2rem solid $second-color;
      border-color: rgba(255, 255, 255, 0);
      box-shadow: none;
    }
    &.error {
      outline: 0.2rem solid $danger-color;
      box-shadow: none;
      border-color: rgba(255, 255, 255, 0);
      & ~ .form-input_label {
        color: $danger-color;
      }
    }
    &:focus ~ .form-input_label {
      @include top-label;
    }
    &:not(:placeholder-shown) ~ .form-input_label {
      @include top-label;
    }
  }
  &_label {
    pointer-events: none;
    position: absolute;
    transform-origin: 0 50%;
    transition: transform 200ms;
    top: 0.8rem;
    padding: 0.2rem 0.5rem;
    max-width: calc(100% - 2rem);
    flex-wrap: nowrap;
    max-height: 50%;
    z-index: 10;
  }
}
</style>
