import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
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
  TimeLimitDto,
  UploadDrawingDto,
  WordToDrawDto,
  WSE,
} from 'shared'
import { PlayerService } from '../player/player.service'
import { WsException, WsResponse } from '@nestjs/websockets'
import { Game } from './entities/game.entity'
import { GameSpecs } from './entities/game.specs.entity'
import { Round } from './entities/round.entity'
import { GriffonaryService } from './griffonary.service'
import { Word } from './entities/word.entity'
import { Player } from '../player/entities/player.entity'
import { Score } from './entities/score.entity'

@Injectable()
export class GameService {
  constructor(
    private roomService: RoomService,
    private playerService: PlayerService,
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

  // Handlers
  async onAskStartGame(client: Socket, gameName: GameName): Promise<void> {
    this.logger.debug('OnaskStartGame ?')
    const player = await this.playerService.getPlayerFromSocket(client)
    const room = await this.roomService.getRoomFromPlayer(player)
    if (room.currentGame != null) {
      this.logger.warn('Room already has a game going on')
      this.griffonary.executeRound(room.currentGame.id)
      return
    }
    const gameSpecs = await this.gameSpecsRepository.findOneBy({ title: gameName })
    if (!gameSpecs) {
      throw new WsException(`${gameName} is not a valid game`)
    }
    if (player.id === room.admin.id) {
      const gameEntity = this.gameRepository.create({ specs: gameSpecs, onGoing: true, room })
      const game = await this.gameRepository.save(gameEntity)
      room.currentGame = game
      this.roomRepository.save(room)
      this.logger.debug(room.currentGame.id)
      const result = await this.roomRepository.save(room)
      this.logger.debug(result.currentGame)
      this.logger.debug(room.currentGame.id)
      this.logger.debug(room.admin)
      this.griffonary.executeRound(room.currentGame.id)
      return
    } else {
      throw new WsException('Unauthorized')
    }
  }
  async onDrawingUpload(
    client: Socket,
    drawing: Blob,
  ): Promise<void | WsResponse<UploadDrawingDto['arguments'] | undefined>> {
    try {
      this.logger.debug('DRAWING SHARED')
      const player = await this.playerService.getPlayerFromSocket(client)
      if (!player) {
        throw new Error('No player')
      }
      const room = await this.roomService.getRoomFromPlayer(player)
      if (!room) {
        throw new Error('No room')
      }
      const round = await this.getLastOngoingORound(room.currentGame)
      if (!round) {
        throw new Error('No round')
      }
      // If player is artist can draw
      if (round.artists.map((artist) => artist.id).includes(player.id)) {
        const data: UploadDrawingDto = {
          event: WSE.UPLOAD_DRAWING,
          arguments: { drawing, player: this.playerService.generatePlauyerInfoDto(player) },
        }
        this.roomService.emitToRoom(room.id, data)
      }
    } catch (error) {
      this.logger.error(error)
      return { event: WSE.STOP_DRAW, data: undefined }
    }
  }
  // Services
  async endGame(room: Room): Promise<void> {
    this.logger.debug('ENDGAME')
    const { currentGame: game } = room
    game.onGoing = false
    this.gameRepository.save(game)
    room.currentGame = null
    await this.roomRepository.save(room)
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
      // .leftJoinAndSelect(Score, 'score', 'score.player.id = user.id')
      .getMany()
    this.logger.debug(JSON.stringify(playerList))
    const data: PlayerListDto = {
      event: WSE.PLAYER_LIST,
      arguments: {
        players: playerList.map((player) => this.playerService.generatePlauyerInfoDto(player)),
      },
    }
    this.roomService.emitToRoom(room.id, data)
  }
  async scorePlayerPoints(player: Player, room: Room, points: number): Promise<void> {
    this.logger.debug('SCORE PLAYER POINTS')
    let score = await this.scoreRepository.findOne({ where: { player, room } })
    if (score != null) {
      score.points += points
      await this.scoreRepository.save(score)
    } else {
      const scoreEntity = this.scoreRepository.create({ player, room, points })
      score = await this.scoreRepository.save(scoreEntity)
      const playerInfo = this.playerService.generatePlauyerInfoDto(player)
      const data: PlayerScoredDto = {
        event: WSE.PLAYER_SCORED,
        arguments: { player: playerInfo, points },
      }
      this.roomService.emitToRoom(room.id, data)
    }
  }
  async getPlayerPoints(player: Player, room: Room): Promise<number> {
    return (await this.scoreRepository.findOne({ where: { player, room } })).points
  }
  async getLastOngoingORound(game: Game): Promise<Round> {
    this.logger.debug('GET LAST ROUND')
    const round = await this.roundRepository
      .createQueryBuilder('round')
      .where('round.game =:game', { game: game.id })
      .andWhere('round.onGoing = true')
      .leftJoinAndSelect('round.artists', 'artist')
      .leftJoinAndSelect('round.haveGuessed', 'haveGuessed')
      .leftJoinAndSelect('round.word', 'word')
      .orderBy('round.createdAt', 'DESC')
      .getOne()
    return round
  }
  async guessWord(word: string, player: Player, room: Room): Promise<boolean> {
    try {
      this.logger.debug('Guess word')
      const currentGame = room.currentGame
      const currentRound = await this.getLastOngoingORound(currentGame)

      // Can not guess if no round Ongoing or player has guessed or player is the artist
      if (
        !currentRound ||
        currentRound.haveGuessed.map((player) => player.id).includes(player.id) ||
        currentRound.artists.map((artist) => artist.id).includes(player.id)
      ) {
        this.logger.debug("Can't make a guess")
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
        )
        await this.scorePlayerPoints(currentRound.artists[0], room, pointStep)

        // add player to guesser list
        currentRound.haveGuessed.push(player)
        await this.roundRepository.save(currentRound)
        return true
      }
      return false
    } catch (error) {
      this.logger.error(error)
    }
  }
  generateGameInfoDto(game: Game): GameInfoDto {
    const { id, specs, roundDuration, onGoing } = game
    return new GameInfoDto({ id, specs, roundDuration, onGoing, room: game.room.id })
  }
}
