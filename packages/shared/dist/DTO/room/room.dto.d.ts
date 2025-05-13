import { PlayerInfoDto } from '../player/player.dto';
import { GameInfoDto, ScoreDto } from '../game/game.dto';
import { ChatMessageDto } from '../chat';
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
