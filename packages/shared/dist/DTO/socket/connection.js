"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AskExcludePlayerDto = exports.AskLeaveRoomDto = exports.InvalidTokenDto = exports.PlayerJoinedRoomSuccessDto = exports.FailCreateRoom = exports.FailJoinRoomDto = exports.PlayerJoinedRoomDto = exports.PlayerReconnectedDto = exports.PlayerConnectionSuccessDto = void 0;
const common_1 = require("./common");
class PlayerConnectionSuccessDto extends common_1.SocketDto {
}
exports.PlayerConnectionSuccessDto = PlayerConnectionSuccessDto;
class PlayerReconnectedDto extends common_1.SocketDto {
}
exports.PlayerReconnectedDto = PlayerReconnectedDto;
class PlayerJoinedRoomDto extends common_1.SocketDto {
}
exports.PlayerJoinedRoomDto = PlayerJoinedRoomDto;
class FailJoinRoomDto extends common_1.SocketDto {
}
exports.FailJoinRoomDto = FailJoinRoomDto;
class FailCreateRoom extends common_1.SocketDto {
}
exports.FailCreateRoom = FailCreateRoom;
class PlayerJoinedRoomSuccessDto extends common_1.SocketDto {
}
exports.PlayerJoinedRoomSuccessDto = PlayerJoinedRoomSuccessDto;
class InvalidTokenDto extends common_1.SocketDto {
}
exports.InvalidTokenDto = InvalidTokenDto;
class AskLeaveRoomDto extends common_1.SocketDto {
}
exports.AskLeaveRoomDto = AskLeaveRoomDto;
class AskExcludePlayerDto extends common_1.SocketDto {
}
exports.AskExcludePlayerDto = AskExcludePlayerDto;
//# sourceMappingURL=connection.js.map