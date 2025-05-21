import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from '../room/entities/room.entity'
import { Repository } from 'typeorm'
import { Server, Socket } from 'socket.io'
import {
  GameInfoDto,
  PlayerListDto,
  PlayerScoredDto,
  StartGameDto,
  TimeLimitDto,
  UploadDrawingDto,
  WordSolutionDto,
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
import { CommonService } from '../common/common.service'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'

@Injectable()
export class GameService {
  constructor(
    private playerService: PlayerService,
    private commonService: CommonService,
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
    this.io = this.commonService.io
  }
  public io: Server
  private readonly logger = new Logger(GameService.name, { timestamp: true })

  // Handlers WS

  /**
   * Handle the request to start a specific game
   * @param {Socket} client The client socket who sent the request
   * @param {string} gameId The Id of the game to start.
   * @returns {Promise<void> }
   */
  async onAskStartGame(client: Socket, gameId: GameSpecs['id']): Promise<void> {
    const player = await this.playerService.getPlayerFromSocket(client)
    if (!player) {
      throw new PlayerNotFoundWsException()
    }
    const room = await this.roomService.getRoomFromPlayer(player)

    if (room.currentGame != null) {
      return
    }
    const gameSpecs = await this.gameSpecsRepository.findOneBy({ id: gameId })
    if (!gameSpecs) {
      throw new GameNotFoundWsException()
    }
    if (player.id === room.admin.id) {
      const gameEntity = this.gameRepository.create({
        specs: gameSpecs,
        onGoing: true,
        room,
        scores: [],
      })
      const game = await this.gameRepository.save(gameEntity, { reload: true })
      room.currentGame = game
      await this.roomRepository.save(room, { reload: true })
      // TODO handle different games
      this.griffonary.executeRound(room.id)

      const data: StartGameDto = {
        event: WSE.START_GAME,
        arguments: { game: this.generateGameInfoDto(game) },
      }
      this.commonService.emitToRoom(room.id, data)
      return
    } else {
      throw new UnauthorizedException()
    }
  }

  /**
   * Handle the upload of a drawing to a room
   * @param {Socket} client The client socket who sent the drawing
   * @param {Buffer} drawing The buffer containing the drawing
   * @returns {Promise<void | WsResponse<UploadDrawingDto['arguments'] | undefined>>} Returns the drawing if allowed
   */
  async onDrawingUpload(
    client: Socket,
    drawing: Buffer,
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
      const round = await this.getLastOngoingORound(room)
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
      this.commonService.emitToRoom(player.room.id, data)
    } catch (error) {
      this.logger.error(error)
      return { event: WSE.STOP_DRAW, data: undefined }
    }
  }

  /**
   * Handle the reconnexion of a player during a game
   * Sends him the related informations
   * @param {Player} player The Player who reconnected
   * @param {Room} room The Room of the player
   * @param {Round} round The current Round of the game
   * @returns {void}
   */
  handleReconnexionDuringGame(player: Player, room: Room, round: Round): void {
    if (!player || !room || !round) {
      return
    }
    if (round.timeLimit) {
      const timeDto: TimeLimitDto = {
        event: WSE.TIME_LIMIT,
        arguments: { time: round.timeLimit.getTime() },
      }
      this.commonService.emitToPlayer(player.id, timeDto)
    }
    if (round.word && round.artists.map((artist) => artist.id).includes(player.id)) {
      this.sendWordToDraw(player, round.word)
    }
  }

  /**
   * Sends the list of available game and their specs
   * @param {boolean=false} detailed If the full specs should be retrieved
   * @returns {Promise<Partial<GameSpecs[]>>}
   */
  async getAvailableGames(detailed: boolean = false): Promise<Partial<GameSpecs[]>> {
    if (detailed) {
      return await this.gameSpecsRepository.find()
    }
    return await this.gameSpecsRepository.find({
      select: { id: true, title: true, description: true, illustration: true, rules: true },
    })
  }

  /**
   * Edits a gamespecs entity
   * @param {Partial<GameSpecs>} editBody The info to update
   * @param {MemoryStorageFile} illustration? The image for the illustration of the game
   * @returns {Promise<GameSpecs>}
   */
  async editGameSpecs(
    editBody: Partial<GameSpecs>,
    illustration?: MemoryStorageFile,
  ): Promise<GameSpecs> {
    const currentSpecs = await this.gameSpecsRepository.findOneBy({ id: editBody.id })
    if (!currentSpecs) {
      throw new NotFoundException('Game specs not found')
    }
    const newSpecs = this.gameSpecsRepository.merge(currentSpecs, editBody)
    if (illustration) {
      const illustrationUrl = await this.commonService.uploadImage(
        illustration,
        newSpecs.id,
        true,
        'game',
        300,
      )
      newSpecs.illustration = illustrationUrl
    }

    await this.gameSpecsRepository.save(newSpecs)
    return newSpecs
  }

  // Services
  /**
   * End the current game of a room
   * The game is no more onGoing and the room currentGame is null
   * @param {Room} room The room
   * @returns { Promise<void> }
   */
  async endGame(room: Room): Promise<void> {
    const { currentGame: game } = room
    game.onGoing = false
    await this.gameRepository.save(game)
    room.currentGame = null
    await this.roomRepository.save(room)
    this.roomService.sendRoomState(room)
  }

  /**
   * Pick a random word from the word table
   * @returns {Promise<Word>}
   */
  async getRandomWord(): Promise<Word> {
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

  /**
   * Sends the round timeLimit to the player of a room
   * @param {string} roomId The Id of the room
   * @param {number} timestamp The timeLimit
   * @returns {void}
   */
  sendTimeLimit(roomId: string, timestamp: number): void {
    const data: TimeLimitDto = { event: WSE.TIME_LIMIT, arguments: { time: timestamp } }
    this.commonService.emitToRoom(roomId, data)
  }

  /**
   * Send the word to draw to an artist Player
   * @param {Player} artist The player who should draw
   * @param {Word} word The word to draw
   * @returns {void}
   */
  sendWordToDraw(artist: Player, word: Word): void {
    const data: WordToDrawDto = { event: WSE.WORD_TO_DRAW, arguments: { word: word.value } }
    this.commonService.emitToPlayer(artist.id, data)
  }

  /**
   * Send the solution of a word to guess to a Room
   * @param {string} roomId The Room Id
   * @param {Word} word The word to draw
   * @returns {void}
   */
  sendWordSolution(roomId: Room['id'], word: Word): void {
    const data: WordSolutionDto = { event: WSE.WORD_SOLUTION, arguments: { word: word.value } }
    this.commonService.emitToRoom(roomId, data)
  }

  /**
   * Send the list of players of a Room, specifying if they are artist
   * @param {Round} round The current Round of the Room currentGame
   * @param {Room} room The Room
   * @returns {Promise<void>}
   */
  async sendPlayerList(round: Round, room: Room): Promise<void> {
    const playerList = await this.playerRepository
      .createQueryBuilder('player')
      .where('player.room.id = :id', { id: room.id })
      .getMany()
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
    this.commonService.emitToRoom(room.id, data)
  }

  /**
   * Set the scores of a player and send it to the its Room
   * @param {Player} player The Player who scored
   * @param {Game} game The current Game
   * @param {number} points The points scored
   * @param {Round} round The current Round
   * @param {string} roomId The Id of the Room
   * @returns { Promise<void>}
   */
  async scorePlayerPoints(
    player: Player,
    game: Game,
    points: number,
    round: Round,
    roomId: string,
  ): Promise<void> {
    let score = await this.scoreRepository
      .createQueryBuilder('score')
      .innerJoin('score.game', 'game')
      .innerJoin('score.player', 'player')
      .where('game.id =:gameId', { gameId: game.id })
      .andWhere('player.id =:playerId', { playerId: player.id })
      .getOne()
    if (score != null) {
      score.points += points
      await this.scoreRepository.save(score)
    } else {
      const scoreEntity = this.scoreRepository.create({ player, game, points })
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
    this.commonService.emitToRoom(roomId, data)
  }

  /**
   * Get the points of a player for the Room CurrentGame
   * @param {Player} player The Player
   * @param {Room} room The Room of the Player
   * @returns {Promise<number>}
   */
  async getPlayerPoints(player: Player, room: Room): Promise<number> {
    return (await this.scoreRepository.findOne({ where: { player, game: room.currentGame } }))
      .points
  }

  /**
   * Retrieve the last onGoing Round of the currentGame of a Room
   * @param {Room} room The Room
   * @returns {Promise<Round | undefined>}
   */
  async getLastOngoingORound(room: Room): Promise<Round | undefined> {
    if (!room) {
      throw new RoomNotFoundWsException()
    }
    const round = await this.roundRepository.findOne({
      where: { game: { room: { id: room.id }, onGoing: true }, onGoing: true },
      relations: {
        word: true,
        haveGuessed: true,
        artists: true,
      },
      order: { createdAt: 'DESC' },
    })

    return round
  }

  /**
   * Handle a guess attempt of a word
   * @param {string} word The guess
   * @param {Player} player The player guessing
   * @param {Room} room The Room of the Player
   * @returns {Promise<boolean>} Return if the chat message should be displayed
   */
  async guessWord(word: string, player: Player, room: Room): Promise<boolean> {
    try {
      const currentRound = await this.getLastOngoingORound(room)
      // Can not guess if no round Ongoing or player has guessed or player is the artist
      if (!currentRound) {
        return true
      }
      if (
        currentRound.haveGuessed.map((player) => player.id).includes(player.id) ||
        currentRound.artists.map((artist) => artist.id).includes(player.id)
      ) {
        return false
      }
      const wordToguess = await this.wordRepository.findOneBy({ id: currentRound.word.id })
      // Check if guess is correct
      if (word.toLowerCase() === wordToguess.value.toLowerCase()) {
        // Set points for the player and the artist
        const { pointsMax, pointStep } = room.currentGame.specs
        await this.scorePlayerPoints(
          player,
          room.currentGame,
          pointsMax - currentRound.haveGuessed.length * pointStep,
          currentRound,
          room.id,
        )
        await this.scorePlayerPoints(
          currentRound.artists[0],
          room.currentGame,
          pointStep,
          currentRound,
          room.id,
        )

        // add player to guesser list
        currentRound.haveGuessed.push(player)
        await this.roundRepository.save(currentRound)
        if (
          room.players
            .map((player) => player.id)
            .every((id) =>
              [
                ...currentRound.haveGuessed.map((p) => p.id),
                ...currentRound.artists.map((a) => a.id),
              ].includes(id),
            )
        ) {
          this.griffonary.endRound(room.id)
        }
        return false
      }
      return true
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * Generate the GameDto from a Game entity
   * @param {Game} game The Game entity
   * @returns {GameInfoDto}
   */
  generateGameInfoDto(game: Game): GameInfoDto {
    try {
      const { id, specs, roundDuration, onGoing, scores } = game
      return new GameInfoDto({
        id,
        specs,
        roundDuration,
        onGoing,
        scores: scores.length
          ? scores.map((score) => ({
              points: score.points,
              player: score.player.id,
            }))
          : [],
        room: game.room.id,
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  /**
   * Sets all games and Round as not Ongoing
   * @returns {Promise<void>}
   */
  async resetGames(): Promise<void> {
    try {
      await this.roundRepository.update({ onGoing: true }, { onGoing: false })
      await this.gameRepository.update({ onGoing: true }, { onGoing: false })
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * Retrieve the word to guess of a round
   * @param {Round} round The round
   * @returns {Promise<Word | undefined>}
   */
  async getWordFromRound(round: Round): Promise<Word | undefined> {
    const word = await this.wordRepository.findOneBy({ id: round.word.id })

    return word
  }
}
