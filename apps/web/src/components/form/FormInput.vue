<template>
  <div class="form-input">
    <input
      v-model="model"
      class="form-input_input"
      :class="{ error: error }"
      :type="type"
      placeholder="   "
    />
    <label class="form-input_label">{{ label }} </label>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>()

withDefaults(defineProps<{ label?: string; error?: boolean; type?: string }>(), {
  type: 'text',
  label: '',
})
</script>

<style lang="scss" scoped>
@mixin top-label {
  transform: translateY(-100%);
  background-color: rgba(255, 255, 255, 0.686);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}
.form-input {
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  outline: none;
  border-radius: 1rem;
  position: relative;
  height: 3rem;
  justify-content: flex-end;
  width: 100%;
  color: var(--main-color);
  overflow: hidden;
  &_input {
    background-color: rgba(255, 255, 255, 0.686);
    outline: none;
    border-radius: 1rem;
    padding: 0 0.5rem;
    height: 1.5rem;
    width: 100%;
    text-align: center;

    border: none;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.552);
    &:focus {
      border: 0.2rem solid var(--main-color);
      box-shadow: none;
    }
    &.error {
      border: 0.2rem solid var(--secondary-color);
      box-shadow: none;
      & ~ .form-input_label {
        color: var(--secondary-color);
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
    transition:
      transform 200ms,
      color 200ms;
    top: 1.5rem;
    padding: 0.2rem 0.5rem;
    max-width: calc(100% - 2rem);
    flex-wrap: nowrap;
    max-height: 50%;
    overflow: hidden;
  }
}
</style>
