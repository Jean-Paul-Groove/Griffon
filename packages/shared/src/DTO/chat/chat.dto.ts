import { PlayerInfoDto } from "../player"

export class ChatMessageDto {
    constructor(
      props: {
        id: string
        content: string
        sender: PlayerInfoDto['id']
        sentAt: Date
      }
    ) {
      Object.assign(this, props)
    }
    id: string
    content: string
    sender: PlayerInfoDto['id']
    sentAt: Date
  }