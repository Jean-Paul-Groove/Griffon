import { PlayerInfoDto } from "../player";
export declare class ChatMessageDto {
    constructor(props: {
        id: string;
        content: string;
        sender: PlayerInfoDto['id'];
        sentAt: Date;
    });
    id: string;
    content: string;
    sender: PlayerInfoDto['id'];
    sentAt: Date;
}
