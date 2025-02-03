import { createRouter, createWebHistory } from 'vue-router'
import { BaseLayout } from '@/components'
import { LandingPage, GamePage } from '@/views'
import { useAuthStore } from '../stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BaseLayout,
      children: [
        { path: '/', name: 'Home', component: LandingPage },
        {
          path: '/game',
          name: 'Game',
          component: GamePage,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const { token } = useAuthStore()
  if (token === null && to.name !== 'Home') {
    return { name: 'Home' }
  }
})

export default router
