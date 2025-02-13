interface BaseUser {
  id: string
  name: string
  room?: {
    id: string
    connected: boolean
    isDrawing: boolean
  }
  avatar?: string
}

type LoggedUser = BaseUser & {
  avatar: string
}
export type Guest = BaseUser & {}

export type User = LoggedUser | Guest
