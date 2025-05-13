import { WSE } from "../../WSE";
import { ChatMessageDto } from "../chat";
import { MessageDto } from "../message";
import { SocketDto } from "./common";
export declare class NewChatMessageDto extends SocketDto {
    event: WSE.NEW_CHAT_MESSAGE;
    arguments: {
        chatMessage: ChatMessageDto;
    };
}
export declare class NewMessageDto extends SocketDto {
    event: WSE.NEW_PRIVATE_MESSAGE;
    arguments: {
        message: MessageDto;
    };
}
