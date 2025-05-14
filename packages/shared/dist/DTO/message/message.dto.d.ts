import { PlayerInfoDto } from '../player';
export declare class MessageDto {
    constructor(props: {
        id: string;
        content: string;
        sender: {
            id: PlayerInfoDto['id'];
            name: PlayerInfoDto['name'];
            role: PlayerInfoDto['role'];
            avatar?: PlayerInfoDto['avatar'];
        };
        receiver: {
            id: PlayerInfoDto['id'];
            name: PlayerInfoDto['name'];
            role: PlayerInfoDto['role'];
            avatar?: PlayerInfoDto['avatar'];
        };
        seen: boolean;
        sentAt: Date;
    });
    id: string;
    content: string;
    sender: {
        id: PlayerInfoDto['id'];
        name: PlayerInfoDto['name'];
        role: PlayerInfoDto['role'];
        avatar: PlayerInfoDto['avatar'];
    };
    receiver: {
        id: PlayerInfoDto['id'];
        name: PlayerInfoDto['name'];
        role: PlayerInfoDto['role'];
        avatar: PlayerInfoDto['avatar'];
    };
    seen: boolean;
    sentAt: Date;
}
