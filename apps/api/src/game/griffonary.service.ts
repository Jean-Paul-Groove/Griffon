import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Server } from 'socket.io'
import { Round } from './entities/round.entity'
import { sample } from 'lodash'
import { GameService } from './game.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { Player } from '../player/entities/player.entity'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { GameNotFoundWsException } from '../common/ws/exceptions/gameNotFound'
import { CommonService } from '../common/common.service'

@Injectable()
export class GriffonaryService {
  constructor(
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    @Inject(forwardRef(() => RoomService))
    private roomService: RoomService,
    private commonService: CommonService,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.io = this.commonService.io
  }
  public io: Server
  private readonly logger = new Logger(GriffonaryService.name, { timestamp: true })

  /**
   * Start a Round of Griffonary
   * @param {string} roomId The Id of the Room
   * @returns {Promise<void>}
   */
  async executeRound(roomId: string): Promise<void> {
    try {
      const room = await this.roomService.get(roomId)

      if (!room) {
        throw new RoomNotFoundWsException()
      }
      if (!room.currentGame) {
        throw new GameNotFoundWsException()
      }
      const lastRound = room.currentGame.rounds[0]
      if (lastRound != null && lastRound.onGoing) {
        return
      }
      const drawingTime =
        room.currentGame.roundDuration ?? room.currentGame.specs.defaultRoundDuration

      // ? GET A PLAYER WHO HAS NOT BEEN AN ARTIST YET
      const formerArtists = this.playerRepository
        .createQueryBuilder('player')
        .innerJoinAndSelect('player.room', 'room')
        .innerJoin('room.currentGame', 'game')
        .innerJoin('game.rounds', 'round')
        .innerJoin('round.artists', 'artist', 'artist.id = player.id')
        .select('player.id')

      const potentialArtist = await this.playerRepository
        .createQueryBuilder('player')
        .where({ room })
        .andWhere('player.id NOT IN (' + formerArtists.getSql() + ')')
        .getMany()

      if (potentialArtist.length === 0) {
        this.gameService.endGame(room)
        return
      }
      const artist = sample(potentialArtist)
      const newWord = await this.gameService.getRandomWord()
      const timeLimit = Date.now() + drawingTime
      const round = this.roundRepository.create({
        game: room.currentGame,
        onGoing: true,
        word: newWord,
        artists: [artist],
        haveGuessed: [],
        timeLimit: new Date(timeLimit),
      })
      await this.roundRepository.save(round)

      this.handleRoundTimeout(drawingTime, roomId, 'end')

      this.gameService.sendWordToDraw(artist, newWord)
      this.gameService.sendPlayerList(round, room)
      this.gameService.sendTimeLimit(room.id, round.timeLimit.getTime())
    } catch (error) {
      this.logger.error(error)
      this.endRound(roomId)
    }
  }

  /**
   * End a Round of Griffonary
   * Send the answer to the word and start a new round
   * @param {string} roomId The Id of the Room
   * @returns { Promise<void>}
   */
  async endRound(roomId: string): Promise<void> {
    try {
      console.log('EEEND OF ROUND')
      const room = await this.roomService.get(roomId)
      const currentRound = await this.gameService.getLastOngoingORound(room)
      if (currentRound.onGoing) {
        const word = await this.gameService.getWordFromRound(currentRound)
        this.gameService.sendWordSolution(roomId, word)
        currentRound.onGoing = false
        await this.roundRepository.save(currentRound)
        this.handleRoundTimeout(2000, roomId, 'start')
        this.roomService.sendRoomState(room)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * Set a timeout to execute or end a round
   * @param {number} time The timeout delay
   * @param {string} roomId The Id of the room of the game
   * @param {'start'|'end'} action The type of action on the round
   * @returns {void}
   */
  handleRoundTimeout(time: number, roomId: string, action: 'start' | 'end'): void {
    const timeOutName = `${roomId}::${action}OfRound`
    const timeOut = setTimeout(
      () => (action === 'start' ? this.executeRound(roomId) : this.endRound(roomId)),
      time,
    )
    if (
      this.schedulerRegistry?.doesExist !== undefined &&
      this.schedulerRegistry?.doesExist('timeout', timeOutName)
    ) {
      this.schedulerRegistry.deleteTimeout(timeOutName)
    }

    this.schedulerRegistry.addTimeout(timeOutName, timeOut)
  }
}
