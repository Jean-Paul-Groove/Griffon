import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'
import { BaseLayout, RoomLayout } from '@/layouts'
import { LandingView, GameView } from '@/views'
import { useAuthStore, useSocketStore } from '../stores'
import LobbyView from '../views/LobbyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BaseLayout,
      children: [
        {
          path: '/',
          name: 'Landing',
          component: LandingView,
          beforeEnter: (): RouteLocationRaw | undefined => {
            const { token } = useAuthStore()
            const { room } = useSocketStore()
            if (token !== null && room?.id) {
              return { name: 'Lobby', params: { roomId: room.id } }
            }
          },
        },
      ],
    },
    {
      path: '/:roomId',
      name: 'Room',
      component: RoomLayout,
      redirect: {
        name: 'Lobby',
      },
      children: [
        {
          path: 'lobby',
          name: 'Lobby',
          component: LobbyView,
        },
        {
          name: 'Game',
          path: 'game',
          redirect: { name: 'Lobby' },
          children: [
            {
              name: 'Griffonary',
              path: 'griffonary',
              component: GameView,
            },
          ],
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'Landing') {
    return true
  }
  const { token } = useAuthStore()
  if (token === null) {
    return { name: 'Landing' }
  }
})

export default router
