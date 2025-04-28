export class PlayerInfoDto {
   constructor(
      props: {
        id: string,
        name: string,
        isGuest: boolean,
        isArtist:boolean,
        avatar?: string,
        room?:string,
        isPlatformAdmin?:boolean
      }
    ) {
      Object.assign(this, props)
    }
  id: string
  name: string
  isGuest: boolean
  isArtist:boolean
  avatar?: string
  room?:string
  isPlatformAdmin?:boolean
}

export class CreateGuestDto {
    name:string
    isGuest:true
}
export class CreateUserDto {
  name:string
  isGuest:false
  email:string
  password:string
}