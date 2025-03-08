import { WSE } from "../../WSE";

export abstract class SocketDto {
    abstract event: WSE
    abstract arguments:any
}