import { WSE } from "../../WSE"
import { PlayerInfoDto } from "../player"
import { SocketDto } from "./common"

export class NewFriendDto extends SocketDto{
    event: WSE.CONFIRM_FRIEND
    arguments: { friend: PlayerInfoDto }
}

export class UpdateFriendsInfoDto extends SocketDto{
    event: WSE.UPDATE_FRIENDS_INFO
    arguments: { friends: Array<PlayerInfoDto & {online:boolean}> }
}