import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'
import { GameView, NotFound, LobbyView } from '@/views'
import { useAuthStore, useSocketStore } from '../stores'
import { useToast } from 'vue-toast-notification'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import RoomLayout from '../layouts/RoomLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UserLayout,
      children: [
        {
          path: '/',
          name: 'Accueil',
          component: HomeView,
          beforeEnter: (): RouteLocationRaw | undefined => {
            const { token } = useAuthStore()
            const { room } = useSocketStore()
            if (token !== null) {
              if (room?.id != null) {
                return { name: 'Lobby', params: { roomId: room.id } }
              }
            } else {
              return { name: 'Connexion' }
            }
          },
        },
        {
          path: '/notFound',
          name: 'Page introuvable',
          component: NotFound,
        },
        {
          path: '/register',
          name: 'Inscription',
          component: RegisterView,
          beforeEnter: (): RouteLocationRaw | undefined => {
            const { token } = useAuthStore()
            const { room } = useSocketStore()
            if (token !== null && room?.id) {
              return { name: 'Lobby', params: { roomId: room.id } }
            }
          },
        },
        {
          path: '/login',
          name: 'Connexion',
          component: LoginView,
          beforeEnter: (): RouteLocationRaw | undefined => {
            console.log('BEFORE ENTERING LOGIN')
            const { token } = useAuthStore()
            const { room } = useSocketStore()
            if (token !== null) {
              if (room?.id != null) {
                return { name: 'Lobby', params: { roomId: room.id } }
              } else return { name: 'Accueil' }
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
        {
          path: '/:pathMatch(.*)*',
          redirect: { name: 'Page introuvable' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  console.log(to)
  if (to.name === 'Accueil' || to.name === 'Inscription' || to.name === 'Connexion') {
    return true
  }
  const { token, setRequestedRoom } = useAuthStore()
  const $toast = useToast()
  if (token === null) {
    if (to.params.roomId != null && typeof to.params.roomId === 'string') {
      setRequestedRoom(to.params.roomId)
      $toast.info('Connectez vous avant de rejoindre un salon', { position: 'top' })
    }
    return { name: 'Connexion' }
  }
})

export default router
