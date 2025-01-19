import DrawingBoard from '@/components/DrawingBoard/DrawingBoard.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DrawingBoard,
    },
  ],
})

export default router
