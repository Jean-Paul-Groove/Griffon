import { PlayerInfoDto } from "../../DTO";
export interface RoomInfo {
    id: string;
    admin: PlayerInfoDto;
    players: PlayerInfoDto[];
    chatMessages: ChatMessage[];
    limit: number;
    currentGame: string;
    scores: Score[];
}
export interface Message {
    id: number;
    sender: PlayerInfoDto;
    content: string;
    sent_at: number;
}
export interface ChatMessage {
    id: number;
    sender: PlayerInfoDto;
    content: string;
}
export interface Score {
    player: PlayerInfoDto;
    points: number;
}
export type GameName = 'Griffonary';
