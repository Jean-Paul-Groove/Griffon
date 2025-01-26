interface BaseUser {
  id: string
  name: string
  room?: {
    roomId: string
    connected: boolean
  }
}

export interface LoggedUser extends BaseUser {
  avatar: string
}
export type Guest = BaseUser

export type User = LoggedUser | Guest
