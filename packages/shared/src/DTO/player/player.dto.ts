import { UserRole } from "../../roles"

export class PlayerInfoDto {
   constructor(
      props: {
        id: string,
        name: string,
        role: UserRole,
        isArtist:boolean,
        avatar?: string,
        room?:string,
        friends?: Array<PlayerInfoDto['id']>
      }
    ) {
      Object.assign(this, props)
    }
  id: string
  name: string
  role: UserRole
  isArtist:boolean
  avatar?: string
  room?:string
  friends?: Array<PlayerInfoDto['id']>

}

export class CreateGuestDto {
    name:string
    role:UserRole.GUEST
}
export class CreateUserDto {
  name:string
  role:UserRole.REGISTERED_USER
  email:string
  password:string
}

