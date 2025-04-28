<template>
  <div class="login-view">
    <LoginForm />
  </div>
</template>

<script setup lang="ts">
import LoginForm from '../components/Login/LoginForm.vue'
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 1rem;
}
</style>
