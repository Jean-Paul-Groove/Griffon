import { WSE } from "../../WSE";
import { PlayerInfoDto } from "../player";
import { RoomInfoDto } from "../room";
import { SocketDto } from "./common";
export declare class PlayerConnectionSuccessDto extends SocketDto {
    event: WSE.CONNECTION_SUCCESS;
    arguments: {
        player: PlayerInfoDto;
    };
}
export declare class PlayerReconnectedDto extends SocketDto {
    event: WSE.USER_RECONNECTED;
    arguments: {
        player: PlayerInfoDto;
    };
}
export declare class PlayerJoinedRoomDto extends SocketDto {
    event: WSE.USER_JOINED_ROOM;
    arguments: {
        player: PlayerInfoDto;
    };
}
export declare class FailJoinRoomDto extends SocketDto {
    event: WSE.FAIL_JOIN_ROOM;
    arguments: {
        reason: string;
    };
}
export declare class FailCreateRoom extends SocketDto {
    event: WSE.FAIL_CREATE_ROOM;
    arguments: {
        reason: string;
    };
}
export declare class PlayerJoinedRoomSuccessDto extends SocketDto {
    event: WSE.USER_JOINED_ROOM_SUCCESS;
    arguments: {
        room: RoomInfoDto;
    };
}
export declare class InvalidTokenDto extends SocketDto {
    event: WSE.INVALID_TOKEN;
    arguments: undefined;
}
export declare class AskLeaveRoomDto extends SocketDto {
    event: WSE.ASK_LEAVE_ROOM;
    arguments: undefined;
}
export declare class AskExcludePlayerDto extends SocketDto {
    event: WSE.ASK_EXCLUDE_PLAYER;
    arguments: {
        playerId: string;
    };
}
