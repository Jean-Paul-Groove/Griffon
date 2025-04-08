import { PlayerInfoDto } from '../player/player.dto';
import { GameInfoDto, ScoreDto } from '../game/game.dto';
export declare class RoomInfoDto {
    constructor(props: {
        id: string;
        admin: PlayerInfoDto['id'];
        players: PlayerInfoDto[];
        limit: number;
        currentGame: GameInfoDto;
        scores: ScoreDto[];
        chatMessages: ChatMessageDto[];
    });
    id: string;
    admin: PlayerInfoDto['id'];
    players: PlayerInfoDto[];
    limit: number;
    currentGame: GameInfoDto;
    scores: ScoreDto[];
    chatMessages: ChatMessageDto[];
}
export declare class ChatMessageDto {
    constructor(props: {
        id: number;
        content: string;
        sender: PlayerInfoDto['id'];
        room: RoomInfoDto['id'];
        sentAt: Date;
    });
    id: number;
    content: string;
    sender: PlayerInfoDto['id'];
    room: RoomInfoDto['id'];
    sentAt: Date;
}
