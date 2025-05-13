import { PlayerInfoDto } from "../player";
export declare class MessageDto {
    constructor(props: {
        id: string;
        content: string;
        sender: PlayerInfoDto['id'];
        receiver: PlayerInfoDto['id'];
        seen: boolean;
        sentAt: Date;
    });
    id: string;
    content: string;
    sender: PlayerInfoDto['id'];
    receiver: PlayerInfoDto['id'];
    seen: boolean;
    sentAt: Date;
}
