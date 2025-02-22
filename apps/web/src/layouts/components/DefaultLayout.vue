<template>
  <transition>
    <main v-if="show" class="layout">
      <HeaderLayout class="layout_header" />
      <main class="layout_main">
        <slot></slot>
      </main>
      <FooterLayout class="layout_footer" />
    </main>
  </transition>
</template>

<script setup lang="ts">
import HeaderLayout from './HeaderLayout.vue'
import FooterLayout from './FooterLayout.vue'
import { nextTick, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ transition: boolean }>(), { transition: false })

const show = ref(true)
onMounted(async () => {
  if (props.transition) {
    console.log('TRIGGER TRANSITION ?')
    show.value = false
    await nextTick()
    show.value = true
  }
})
</script>

<style scoped lang="scss">
$scrolls-height: calc(100vw / 20);
.layout {
  transition: all 0.7s ease-out;
  height: 100vh;
  max-height: 100vh;
  padding-top: calc($scrolls-height / 2);
  padding-bottom: calc($scrolls-height * 0.2);
  background: url('../../assets/background/body-scroll.webp');
  background-size: 100vw 100vh;
  position: relative;
  overflow: hidden;
  &_header {
    position: absolute;
    top: calc(-1 * $scrolls-height * 0.1);
    left: 0;
    right: 0;
  }
  &_footer {
    position: absolute;
    bottom: calc(-1 * $scrolls-height/1.5);
    left: 0;
    right: 0;
  }
  &_main {
    padding-top: calc($scrolls-height / 2);
    padding-bottom: calc($scrolls-height * 0.2);
    padding-left: 7vw;
    padding-right: 7vw;
    max-height: 100%;
    height: 100%;
  }
}
.v-enter-from {
  height: $scrolls-height;
  margin-top: calc(50vh - $scrolls-height/2);
}
.v-enter-active {
  overflow: visible;
}
</style>
