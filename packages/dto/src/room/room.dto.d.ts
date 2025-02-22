import { User } from "../users/types";
import { Message } from "./types";
export declare class RoomInfoDto {
    id: string;
    owner: string | null;
    users: User[];
    messages: Message[];
    maxNumPlayer: number;
}
