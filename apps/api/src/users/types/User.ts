interface BaseUser {
  id: string
  username: string
}

export interface LoggedUser extends BaseUser {
  avatar: string
}
export type Guest = BaseUser

export type User = LoggedUser | Guest
