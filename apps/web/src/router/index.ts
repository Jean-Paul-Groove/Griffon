import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'
import { BaseLayout, RoomLayout } from '@/layouts'
import { LandingView, GameView, NotFound, LobbyView } from '@/views'
import { useAuthStore, useSocketStore } from '../stores'
import { useToast } from 'vue-toast-notification'

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
          name: 'Accueil',
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
      path: '/notFound',
      component: BaseLayout,
      children: [
        {
          path: '/',
          name: 'Page introuvable',
          component: NotFound,
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
        {
          path: '/:pathMatch(.*)*',
          redirect: { name: 'Page introuvable' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'Accueil') {
    return true
  }
  const { token, setRequestedRoom } = useAuthStore()
  const $toast = useToast()
  if (token === null) {
    if (to.params.roomId != null && typeof to.params.roomId === 'string') {
      setRequestedRoom(to.params.roomId)
      $toast.info('Connectez vous avant de rejoindre un salon', { position: 'top' })
    }
    return { name: 'Accueil' }
  }
})

export default router
