import { WSE } from "../../WSE";
import { PlayerInfoDto } from "../player";
import { RoomInfoDto } from "../room";
import { SocketDto } from "./common";

export class PlayerConnectionSuccessDto extends SocketDto{
    event: WSE.CONNECTION_SUCCESS
    arguments: { player: PlayerInfoDto }
}
export class PlayerReconnectedDto extends SocketDto{
    event: WSE.USER_RECONNECTED
    arguments: { player: PlayerInfoDto }
}
export class PlayerJoinedRoomDto extends SocketDto{
    event: WSE.USER_JOINED_ROOM
    arguments: { player: PlayerInfoDto }
}

export class FailJoinRoomDto extends SocketDto{
    event: WSE.FAIL_JOIN_ROOM
    arguments: { reason: string }
}
export class FailCreateRoom extends SocketDto{
    event: WSE.FAIL_CREATE_ROOM
    arguments: { reason: string }
}
export class PlayerJoinedRoomSuccessDto extends SocketDto{
    event: WSE.USER_JOINED_ROOM_SUCCESS
    arguments: { room: RoomInfoDto }
}
export class InvalidTokenDto extends SocketDto {
    event: WSE.INVALID_TOKEN
    arguments: undefined
}
