export declare class PlayerInfoDto {
    constructor(props: {
        id: string;
        name: string;
        isGuest: boolean;
        isArtist: boolean;
        avatar?: string;
        room?: string;
    });
    id: string;
    name: string;
    isGuest: boolean;
    isArtist: boolean;
    avatar?: string;
    room?: string;
}
export declare class CreateGuestDto {
    name: string;
    isGuest: true;
}
