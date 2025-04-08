import { PlayerInfoDto } from '../player/player.dto';
import { RoomInfoDto } from '../room';
export declare class GameInfoDto {
    constructor(props: {
        id: string;
        specs: SpecsDto;
        room: RoomInfoDto['id'];
        roundDuration: number | null;
        onGoing: boolean;
    });
    id: string;
    specs: SpecsDto;
    room: RoomInfoDto['id'];
    roundDuration: number | null;
    onGoing: boolean;
}
export declare class SpecsDto {
    constructor(props: {
        id: string;
        title: string;
        description: string;
        illustration: string | null;
        rules: string | null;
        withGuesses: boolean;
        defaultRoundDuration: number;
        pointStep: number;
        pointsMax: number;
    });
    id: string;
    title: string;
    description: string;
    illustration: string | null;
    rules: string | null;
    withGuesses: boolean;
    defaultRoundDuration: number;
    pointStep: number;
    pointsMax: number;
}
export declare class ScoreDto {
    constructor(props: {
        id: string;
        points: number;
        player: PlayerInfoDto['id'];
        room: RoomInfoDto['id'];
    });
    id: string;
    points: number;
    player: PlayerInfoDto['id'];
    room: RoomInfoDto['id'];
}
