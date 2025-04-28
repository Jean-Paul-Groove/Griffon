import { WSE } from "../../WSE";
import { GameInfoDto, RoomScoreDto } from "../game";
import { PlayerInfoDto } from "../player";
import { RoomInfoDto } from "../room";
import { SocketDto } from "./common";
export declare class PlayerScoredDto extends SocketDto {
    event: WSE.PLAYER_SCORED;
    arguments: {
        player: PlayerInfoDto;
        points: number;
    };
}
export declare class RoomStateDto extends SocketDto {
    event: WSE.ROOM_STATE;
    arguments: {
        room: RoomInfoDto;
    };
}
export declare class TimeLimitDto extends SocketDto {
    event: WSE.TIME_LIMIT;
    arguments: {
        time: number;
    };
}
export declare class WordToDrawDto extends SocketDto {
    event: WSE.WORD_TO_DRAW;
    arguments: {
        word: string;
    };
}
export declare class UploadDrawingDto extends SocketDto {
    event: WSE.UPLOAD_DRAWING;
    arguments: {
        drawing: Buffer | Blob;
        player: PlayerInfoDto;
    };
}
export declare class StopDrawDto extends SocketDto {
    event: WSE.STOP_DRAW;
    arguments: undefined;
}
export declare class PlayerListDto extends SocketDto {
    event: WSE.PLAYER_LIST;
    arguments: {
        players: PlayerInfoDto[];
    };
}
export declare class StartGameDto extends SocketDto {
    event: WSE.START_GAME;
    arguments: {
        game: GameInfoDto;
    };
}
export declare class FailStartGame extends SocketDto {
    event: WSE.FAIL_START_GAME;
    arguments: {
        reason: string;
    };
}
export declare class ScoreListDto extends SocketDto {
    event: WSE.SCORE_LIST;
    arguments: {
        scores: RoomScoreDto[];
    };
}
