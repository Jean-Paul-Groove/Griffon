import { createRouter, createWebHistory } from 'vue-router'
import { BaseLayout } from '@/components'
import { LandingPage, GamePage } from '@/views'

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
          beforeEnter: (to, from, next): void => {
            const token = localStorage.getItem('JWT')
            if (token != null && token.trim() !== '') {
              next()
            }
            next(false)
          },
        },
      ],
    },
  ],
})

export default router
