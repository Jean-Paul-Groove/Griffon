import { WSE } from "../../WSE";
import { GameInfoDto, ScoreDto } from "../game";
import { PlayerInfoDto } from "../player";
import { RoomInfoDto } from "../room";
import { SocketDto } from "./common";

export class PlayerScoredDto extends SocketDto{
    event: WSE.PLAYER_SCORED
    arguments: { player: PlayerInfoDto, points:number }
}
export class RoomStateDto extends SocketDto{
    event: WSE.ROOM_STATE
    arguments: { room: RoomInfoDto }
}
export class TimeLimitDto extends SocketDto {
    event: WSE.TIME_LIMIT
     arguments: {time:number}
}

export class WordToDrawDto extends SocketDto {
    event: WSE.WORD_TO_DRAW
    arguments: {word:string}
}

export class WordSolutionDto extends SocketDto {
    event: WSE.WORD_SOLUTION
    arguments: {word:string}
}

export class UploadDrawingDto extends SocketDto {
    event: WSE.UPLOAD_DRAWING
    arguments: {drawing:Buffer | Blob, player:PlayerInfoDto}
}

export class StopDrawDto extends SocketDto {
    event: WSE.STOP_DRAW
    arguments: undefined
}

export class PlayerListDto extends SocketDto {
    event: WSE.PLAYER_LIST
    arguments: {players:PlayerInfoDto[]}
}

export class StartGameDto extends SocketDto {
    event: WSE.START_GAME
    arguments: {game: GameInfoDto}
}
export class FailStartGame extends SocketDto {
    event: WSE.FAIL_START_GAME
    arguments: {reason: string}
}
export class ScoreListDto extends SocketDto {
    event: WSE.SCORE_LIST
    arguments: {scores:ScoreDto[]}
}