export enum WSE {
  // CONNECTION
  INVALID_TOKEN = 'invalid-token',
  ASK_CREATE_ROOM = 'ask-create-room',
  ASK_JOIN_ROOM = 'ask-join-room',
  USER_JOINED_ROOM_SUCCESS = 'user-joined-room-successfully',
  USER_JOINED_ROOM = 'user-joined-room',
  USER_LEFT_ROOM = 'user-left-room',
  CONNECTION_SUCCESS = 'user-connected-successfully',
  DISCONNECTION = 'disconnect',
  USER_DISCONNECTED = 'user-disconnected',
  USER_RECONNECTED = 'user-reconnected',
  // GAME
  ASK_START_GAME = 'ask-start-game',
  START_GAME = 'start-game',
  ASK_PLAYER_LIST='ask-player-list',
  PLAYER_LIST='player-list',
  CAN_DRAW = 'user-can-draw',
  TIME_LIMIT = 'time-limit',
  STOP_DRAW = 'stop-draw',
  UPLOAD_DRAWING = 'upload-drawing',
  NEW_ARTIST = 'new-artist',
  WORD_TO_DRAW = 'word-to-draw',
  GUESS_WORD = 'guess-word',
  STOP_GUESS = 'stop-guess',
  PLAYER_SCORED = 'player-scored',
  // CHAT
  NEW_MESSAGE = 'new-message',
}
