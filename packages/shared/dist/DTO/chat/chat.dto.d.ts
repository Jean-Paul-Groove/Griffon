import { PlayerInfoDto } from '../player';
export declare class ChatMessageDto {
    constructor(props: {
        id: string;
        content: string;
        sender: {
            id: PlayerInfoDto['id'];
            name: PlayerInfoDto['name'];
            role: PlayerInfoDto['role'];
            avatar?: PlayerInfoDto['avatar'];
        };
        sentAt: Date;
    });
    id: string;
    content: string;
    sender: {
        id: PlayerInfoDto['id'];
        name: PlayerInfoDto['name'];
        role: PlayerInfoDto['role'];
        avatar?: PlayerInfoDto['avatar'];
    };
    sentAt: Date;
}
