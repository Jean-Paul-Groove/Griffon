export enum WSE {
  // CONNECTION
  INVALID_TOKEN = 'invalid-token',
  ASK_CREATE_ROOM = 'ask-create-room',
  ASK_JOIN_ROOM = 'ask-join-room',
  ASK_LEAVE_ROOM = 'ask-leave-room',
  ASK_EXCLUDE_PLAYER = 'ask-exclude-player',
  USER_JOINED_ROOM_SUCCESS = 'user-joined-room-successfully',
  USER_JOINED_ROOM = 'user-joined-room',
  USER_LEFT_ROOM = 'user-left-room', //
  CONNECTION_SUCCESS = 'user-connected-successfully',
  DISCONNECTION = 'disconnect',
  USER_DISCONNECTED = 'user-disconnected',
  USER_RECONNECTED = 'user-reconnected',
  // GAME
  ASK_START_GAME = 'ask-start-game',
  START_GAME = 'start-game',
  ASK_PLAYER_LIST='ask-player-list', // 
  PLAYER_LIST='player-list',
  ROOM_STATE='room-state',
  CAN_DRAW = 'user-can-draw',
  TIME_LIMIT = 'time-limit',
  STOP_DRAW = 'stop-draw',
  UPLOAD_DRAWING = 'upload-drawing',
  NEW_ARTIST = 'new-artist', // ? 
  NEW_ROUND = 'new-round',
  WORD_TO_DRAW = 'word-to-draw',
  GUESS_WORD = 'guess-word', //
  STOP_GUESS = 'stop-guess',//
  PLAYER_SCORED = 'player-scored',
  SCORE_LIST='score-list',
  // CHAT
  NEW_CHAT_MESSAGE = 'new-chat-message',
  // MESSAGE
  NEW_PRIVATE_MESSAGE = 'new-private-message',
  // FRIENDS
  ASK_ADD_FRIEND="ask-add-friend",
  CONFIRM_FRIEND="confirm_friend",
  REJECT_FRIEND="reject_friend",
  REMOVE_FRIEND="remove_friend",
  ASK_FRIENDS_INFO="ask-friends-info",
  UPDATE_FRIENDS_INFO="update-friends-info",

  // ERRORS
  FAIL_CREATE_ROOM='fail-create-room',
  FAIL_JOIN_ROOM='fail-join-room',
  FAIL_START_GAME='fail-start-game',
  ROOM_NOT_FOUND='room-not-found',
  PLAYER_NOT_FOUND='player-not-found',
  GAME_NOT_FOUND='game-not-found',
  ROUND_NOT_FOUND='round-not-found',
  INVALID_CREDENTIALS='invalid-credentials',
  UNAUTHORIZED='unauthorized'

}
