import { createRouter, createWebHistory } from 'vue-router'
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
          beforeEnter: ():
            | {
                name: string
                params: { [key: string]: string }
              }
            | undefined => {
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
      children: [
        {
          path: 'lobby',
          name: 'Lobby',
          component: LobbyView,
        },
        {
          path: 'game',
          name: 'Game',
          component: GameView,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const { token } = useAuthStore()
  if (token === null && to.name !== 'Landing') {
    return { name: 'Landing' }
  }
})

export default router
