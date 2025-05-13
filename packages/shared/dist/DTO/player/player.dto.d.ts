import { UserRole } from "../../roles";
export declare class PlayerInfoDto {
    constructor(props: {
        id: string;
        name: string;
        role: UserRole;
        isArtist: boolean;
        avatar?: string;
        room?: string;
        friends?: Array<PlayerInfoDto['id']>;
    });
    id: string;
    name: string;
    role: UserRole;
    isArtist: boolean;
    avatar?: string;
    room?: string;
    friends?: Array<PlayerInfoDto['id']>;
}
export declare class CreateGuestDto {
    name: string;
    role: UserRole.GUEST;
}
export declare class CreateUserDto {
    name: string;
    role: UserRole.REGISTERED_USER;
    email: string;
    password: string;
}
