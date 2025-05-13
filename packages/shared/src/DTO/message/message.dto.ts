import { PlayerInfoDto } from "../player"

export class MessageDto {
    constructor(
      props: {
        id: string
        content: string
        sender: PlayerInfoDto['id']
        receiver:PlayerInfoDto['id']
        seen:boolean,
        sentAt: Date
      }
    ) {
      Object.assign(this, props)
    }
    id: string
    content: string
    sender: PlayerInfoDto['id']
    receiver:PlayerInfoDto['id']
    seen:boolean
    sentAt: Date
  }