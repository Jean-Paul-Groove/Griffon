export class PlayerInfoDto {
   constructor(
      props: {
        id: string,
        name: string,
        isGuest: boolean,
        isArtist:boolean,
        avatar?: string,
        room?:string
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
}

export class CreateGuestDto {
    name:string
    isGuest:true
}