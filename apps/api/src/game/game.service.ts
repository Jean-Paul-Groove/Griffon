import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from '../room/entities/room.entity'
import { Repository } from 'typeorm'
import { Server, Socket } from 'socket.io'
import {
  GameInfoDto,
  GameName,
  PlayerListDto,
  PlayerScoredDto,
  ScoreListDto,
  StartGameDto,
  TimeLimitDto,
  UploadDrawingDto,
  WordToDrawDto,
  WSE,
} from 'shared'
import { PlayerService } from '../player/player.service'
import { WsResponse } from '@nestjs/websockets'
import { Game } from './entities/game.entity'
import { GameSpecs } from './entities/game.specs.entity'
import { Round } from './entities/round.entity'
import { GriffonaryService } from './griffonary.service'
import { Word } from './entities/word.entity'
import { Player } from '../player/entities/player.entity'
import { Score } from './entities/score.entity'
import { PlayerNotFoundWsException } from '../common/ws/exceptions/playerNotFound'
import { GameNotFoundWsException } from '../common/ws/exceptions/gameNotFound'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { RoundNotFoundWsException } from '../common/ws/exceptions/roundNotFound'

@Injectable()
export class GameService {
  constructor(
    private playerService: PlayerService,
    @Inject(forwardRef(() => RoomService))
    private roomService: RoomService,
    @Inject(forwardRef(() => GriffonaryService))
    private griffonary: GriffonaryService,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(GameSpecs)
    private gameSpecsRepository: Repository<GameSpecs>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {
    this.io = this.roomService.io
  }
  public io: Server
  private readonly logger = new Logger(GameService.name, { timestamp: true })

  // Handlers WS
  async onAskStartGame(client: Socket, gameName: GameName): Promise<void> {
    this.logger.debug('OnaskStartGame ?')
    const player = await this.playerService.getPlayerFromSocket(client)
    if (!player) {
      throw new PlayerNotFoundWsException()
    }
    const room = await this.roomService.getRoomFromPlayer(player)

    if (room.currentGame != null) {
      this.logger.warn('Room already has a game going on')
      return
    }
    const gameSpecs = await this.gameSpecsRepository.findOneBy({ title: gameName })
    if (!gameSpecs) {
      throw new GameNotFoundWsException()
    }
    if (player.id === room.admin.id) {
      const gameEntity = this.gameRepository.create({ specs: gameSpecs, onGoing: true, room })
      const game = await this.gameRepository.save(gameEntity, { reload: true })
      room.currentGame = game
      await this.roomRepository.save(room, { reload: true })
      this.logger.debug(room.currentGame.id)
      const data: StartGameDto = {
        event: WSE.START_GAME,
        arguments: { game: this.generateGameInfoDto(game) },
      }
      this.roomService.emitToRoom(room.id, data)
      this.griffonary.executeRound(room.id)
      return
    } else {
      throw new UnauthorizedException()
    }
  }
  async onDrawingUpload(
    client: Socket,
    drawing: Blob,
  ): Promise<void | WsResponse<UploadDrawingDto['arguments'] | undefined>> {
    try {
      const player = await this.playerService.getPlayerFromSocket(client)
      if (!player) {
        throw new PlayerNotFoundWsException()
      }
      const room = await this.roomService.get(player.room.id)
      if (!room) {
        throw new RoomNotFoundWsException()
      }
      const round = this.getLastOngoingORound(room)
      if (!round) {
        throw new RoundNotFoundWsException()
      }
      const data: UploadDrawingDto = {
        event: WSE.UPLOAD_DRAWING,
        arguments: {
          drawing,
          player: this.playerService.generatePlayerInfoDto(player, [player.id]),
        },
      }
      this.roomService.emitToRoom(player.room.id, data)
    } catch (error) {
      this.logger.error(error)
      return { event: WSE.STOP_DRAW, data: undefined }
    }
  }
  handleReconnexionDuringGame(player: Player, room: Room, round: Round): void {
    if (!player || !room || !round) {
      this.logger.warn('No valid reconnexion during game')
      return
    }
    if (round.timeLimit) {
      const timeDto: TimeLimitDto = {
        event: WSE.TIME_LIMIT,
        arguments: { time: round.timeLimit.getTime() },
      }
      this.roomService.emitToPlayer(player, timeDto)
    }
    if (round.word && round.artists.map((artist) => artist.id).includes(player.id)) {
      this.sendWordToDraw(player, round.word)
    }
  }
  // Handlers HTTP
  async getAvailableGames(): Promise<Partial<GameSpecs[]>> {
    return await this.gameSpecsRepository.find()
  }
  async askStartGame(player: Player, gameName: string): Promise<void> {
    this.logger.debug('OnaskStartGame ?')
    if (!player) {
      throw new PlayerNotFoundWsException()
    }
    const room = await this.roomService.getRoomFromPlayer(player)

    if (room.currentGame != null) {
      this.logger.warn('Room already has a game going on')
      return
    }
    const gameSpecs = await this.gameSpecsRepository.findOneBy({ title: gameName })
    if (!gameSpecs) {
      throw new GameNotFoundWsException()
    }
    if (player.id === room.admin.id) {
      const gameEntity = this.gameRepository.create({ specs: gameSpecs, onGoing: true, room })
      const game = await this.gameRepository.save(gameEntity, { reload: true })
      room.currentGame = game
      await this.roomRepository.save(room, { reload: true })
      this.logger.debug(room.currentGame.id)
      const data: StartGameDto = {
        event: WSE.START_GAME,
        arguments: { game: this.generateGameInfoDto(game) },
      }
      this.roomService.emitToRoom(room.id, data)
      this.griffonary.executeRound(room.id)
      return
    } else {
      throw new UnauthorizedException()
    }
  }
  // Services
  async endGame(room: Room): Promise<void> {
    this.logger.debug('ENDGAME')
    const { currentGame: game } = room
    game.onGoing = false
    await this.gameRepository.save(game)
    room.currentGame = null
    await this.roomRepository.save(room)
    this.roomService.sendRoomState(room)
  }
  async getRandomWord(): Promise<Word> {
    this.logger.debug('GETRANDOMWORD')
    const [word] = await this.wordRepository
      .createQueryBuilder()
      .select()
      .orderBy('RANDOM()')
      .limit(1)
      .execute()
    const wordEntity = new Word()
    wordEntity.id = word.Word_id
    wordEntity.value = word.Word_value
    wordEntity.createdAt = word.Word_createdAt
    wordEntity.updatedAt = word.Word_updatedAt
    return wordEntity
  }
  sendTimeLimit(roomId: string, timestamp: number): void {
    this.logger.debug('SENDTIMELIMIT')
    const data: TimeLimitDto = { event: WSE.TIME_LIMIT, arguments: { time: timestamp } }
    this.roomService.emitToRoom(roomId, data)
  }
  sendWordToDraw(artist: Player, word: Word): void {
    this.logger.debug('SENDWORDTODRAW')
    this.logger.debug(word.value)

    const data: WordToDrawDto = { event: WSE.WORD_TO_DRAW, arguments: { word: word.value } }
    this.roomService.emitToPlayer(artist, data)
  }
  async sendPlayerList(round: Round, room: Room): Promise<void> {
    this.logger.debug('SEND PLAYERLIST')
    const playerList = await this.playerRepository
      .createQueryBuilder('player')
      .where('player.room.id = :id', { id: room.id })
      .getMany()
    this.logger.debug(JSON.stringify(playerList))
    const data: PlayerListDto = {
      event: WSE.PLAYER_LIST,
      arguments: {
        players: playerList.map((player) =>
          this.playerService.generatePlayerInfoDto(
            player,
            round.artists.map((artist) => artist.id),
          ),
        ),
      },
    }
    this.roomService.emitToRoom(room.id, data)
  }
  async scorePlayerPoints(player: Player, room: Room, points: number, round: Round): Promise<void> {
    this.logger.debug('SCORE PLAYER POINTS')
    let score = await this.scoreRepository
      .createQueryBuilder('score')
      .innerJoin('score.room', 'room')
      .innerJoin('score.player', 'player')
      .where('room.id =:roomId', { roomId: room.id })
      .andWhere('player.id =:playerId', { playerId: player.id })
      .getOne()
    if (score != null) {
      this.logger.debug(score)
      score.points += points
      await this.scoreRepository.save(score)
    } else {
      this.logger.debug('NO SCORE FOUND WITH ROOM AND PLAYER')
      const scoreEntity = this.scoreRepository.create({ player, room, points })
      score = await this.scoreRepository.save(scoreEntity)
    }
    const playerInfo = this.playerService.generatePlayerInfoDto(
      player,
      round.artists.map((artist) => artist.id),
    )
    const data: PlayerScoredDto = {
      event: WSE.PLAYER_SCORED,
      arguments: { player: playerInfo, points },
    }
    this.roomService.emitToRoom(room.id, data)
  }
  async sendScore(room: Room): Promise<void> {
    try {
      const data: ScoreListDto = {
        event: WSE.SCORE_LIST,
        arguments: {
          scores: room.scores
            ? room.scores.map((score) => ({
                id: score.id,
                player: score.player.id,
                points: score.points,
                room: room.id,
              }))
            : [],
        },
      }
      this.roomService.emitToRoom(room.id, data)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async getPlayerPoints(player: Player, room: Room): Promise<number> {
    return (await this.scoreRepository.findOne({ where: { player, room } })).points
  }
  async getLastOngoingORound(room: Room): Promise<Round | undefined> {
    if (!room) {
      throw new RoomNotFoundWsException()
    }
    if (!room.currentGame) {
      throw new GameNotFoundWsException()
    }
    const round = room.currentGame.rounds[0]
    // Check that round time limit isn't over
    if (round && round.timeLimit.getTime() < Date.now()) {
      round.onGoing = false
      await this.roundRepository.save(round)
      return undefined
    }
    return round
  }
  async guessWord(word: string, player: Player, room: Room): Promise<boolean> {
    try {
      this.logger.debug('Guess word')
      const currentRound = await this.getLastOngoingORound(room)

      // Can not guess if no round Ongoing or player has guessed or player is the artist
      if (!currentRound) {
        this.logger.debug("Can't make a guess, message can be shared")
        return true
      }
      if (
        currentRound.haveGuessed.map((player) => player.id).includes(player.id) ||
        currentRound.artists.map((artist) => artist.id).includes(player.id)
      ) {
        this.logger.debug("Can't make a guess, message can not be shared")
        return false
      }
      // Check if guess is correct
      if (word.toLowerCase() === currentRound.word.value.toLowerCase()) {
        // Set points for the player and the artist
        const { pointsMax, pointStep } = room.currentGame.specs
        await this.scorePlayerPoints(
          player,
          room,
          pointsMax - currentRound.haveGuessed.length * pointStep,
          currentRound,
        )
        await this.scorePlayerPoints(currentRound.artists[0], room, pointStep, currentRound)

        // add player to guesser list
        currentRound.haveGuessed.push(player)
        await this.roundRepository.save(currentRound)
        this.logger.debug('Has guessed correctly, message can not be shared')
        return false
      }
      return true
    } catch (error) {
      this.logger.error(error)
    }
  }
  generateGameInfoDto(game: Game): GameInfoDto {
    this.logger.debug('GENERATEGAMEINFO')
    const { id, specs, roundDuration, onGoing } = game
    return new GameInfoDto({ id, specs, roundDuration, onGoing, room: game.room.id })
  }
}
