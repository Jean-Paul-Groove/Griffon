import { WSE } from "../../WSE";
import { ChatMessageDto } from "../room";
import { SocketDto } from "./common";
export declare class NewChatMessageDto extends SocketDto {
    event: WSE.NEW_MESSAGE;
    arguments: {
        chatMessage: ChatMessageDto;
    };
}
