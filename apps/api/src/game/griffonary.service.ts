import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from '../room/entities/room.entity'
import { Repository } from 'typeorm'
import { Server } from 'socket.io'
import { Game } from './entities/game.entity'
import { GameSpecs } from './entities/game.specs.entity'
import { Round } from './entities/round.entity'
import { sample } from 'lodash'
import { GameService } from './game.service'
import { Word } from './entities/word.entity'
import { SchedulerRegistry } from '@nestjs/schedule'
import { Player } from '../player/entities/player.entity'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { GameNotFoundWsException } from '../common/ws/exceptions/gameNotFound'

@Injectable()
export class GriffonaryService {
  constructor(
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    @Inject(forwardRef(() => RoomService))
    private roomService: RoomService,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GameSpecs)
    private gameSpecsRepository: Repository<GameSpecs>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.io = this.roomService.io
  }
  public io: Server
  private readonly logger = new Logger(GriffonaryService.name, { timestamp: true })
  async executeRound(roomId: string): Promise<void> {
    try {
      this.logger.debug('EXECUTE ROUND')
      const room = await this.roomService.get(roomId)

      if (!room) {
        throw new RoomNotFoundWsException()
      }
      if (!room.currentGame) {
        throw new GameNotFoundWsException()
      }
      this.logger.debug('AT BEGINNNING OF ROUND EXECUTIOn')
      const lastRound = room.currentGame.rounds[0]

      if (lastRound != null && lastRound.onGoing) {
        this.logger.warn('A ROUND IS ALREADY ONGOING')
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
        this.logger.debug('Everyone was an artist')
        this.gameService.endGame(room)
        if (
          this.schedulerRegistry?.doesExist !== undefined &&
          this.schedulerRegistry.doesExist('timeout', `${room.id}::endOfRound`)
        ) {
          this.schedulerRegistry.deleteTimeout(`${room.id}::endOfRound`)
        }
        return
      }
      const artist = sample(potentialArtist)
      const newWord = await this.gameService.getRandomWord()
      const timeLimit = Date.now() + drawingTime
      this.logger.debug('artist', artist)
      this.logger.debug('newWord', newWord)
      this.logger.debug('drawingTime', drawingTime)
      this.logger.debug('time', timeLimit)
      const round = this.roundRepository.create({
        game: room.currentGame,
        onGoing: true,
        word: newWord,
        artists: [artist],
        haveGuessed: [],
        timeLimit: new Date(timeLimit),
      })
      await this.roundRepository.save(round)
      const timeOutName = `${room.id}::endOfRound`
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        this.schedulerRegistry?.doesExist('timeout', timeOutName)
      ) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      const timeOut = setTimeout(() => this.endRound(roomId), drawingTime)
      this.schedulerRegistry.addTimeout(timeOutName, timeOut)

      this.gameService.sendWordToDraw(artist, newWord)
      this.gameService.sendPlayerList(round, room)
      this.gameService.sendTimeLimit(room.id, round.timeLimit.getTime())
    } catch (error) {
      this.logger.error(error)
    }
  }
  async endRound(roomId: string): Promise<void> {
    try {
      this.logger.debug('End round')
      const room = await this.roomService.get(roomId)
      const currentRound = await this.gameService.getLastOngoingORound(room)
      if (currentRound) {
        currentRound.onGoing = false
        await this.roundRepository.save(currentRound)
      }
      this.roomService.sendRoomState(room)
      this.executeRound(roomId)
    } catch (error) {
      this.logger.error(error)
    }
  }
}
