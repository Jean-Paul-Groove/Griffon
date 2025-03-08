import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from '../room/entities/room.entity'
import { Repository } from 'typeorm'
import { Server } from 'socket.io'
import { WsException } from '@nestjs/websockets'
import { Game } from './entities/game.entity'
import { GameSpecs } from './entities/game.specs.entity'
import { Round } from './entities/round.entity'
import { sample } from 'lodash'
import { GameService } from './game.service'
import { Word } from './entities/word.entity'
import { SchedulerRegistry } from '@nestjs/schedule'
import { Player } from '../player/entities/player.entity'

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
  async executeRound(gameId: string): Promise<void> {
    try {
      this.logger.debug('EXECUTE ROUND')
      const room = await this.roomRepository.findOne({
        where: { currentGame: { id: gameId } },
        relations: { players: true, currentGame: { specs: true } },
      })

      if (!room) {
        throw new WsException('No room')
      }
      if (!room.currentGame) {
        throw new WsException('No game on')
      }
      this.logger.debug('AT BEGINNNING OF ROUND EXECUTIOn')
      const lastRound = await this.gameService.getLastOngoingORound(room.currentGame)

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
        if (this.schedulerRegistry.doesExist('timeout', `${room.id}::endOfRound`)) {
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
      })
      await this.roundRepository.save(round)
      const timeOutName = `${room.id}::endOfRound`
      if (this.schedulerRegistry.doesExist('timeout', timeOutName)) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      const timeOut = setTimeout(() => this.endRound(gameId), drawingTime)
      this.schedulerRegistry.addTimeout(timeOutName, timeOut)

      this.gameService.sendWordToDraw(artist, newWord)
      this.gameService.sendPlayerList(round, room)
      this.gameService.sendTimeLimit(room.id, timeLimit)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async endRound(gameId: string): Promise<void> {
    try {
      this.logger.debug('End round')
      const game = new Game()
      game.id = gameId
      const currentRound = await this.gameService.getLastOngoingORound(game)
      if (!currentRound) {
        throw new Error('NO ROUND')
      }
      currentRound.onGoing = false
      await this.roundRepository.save(currentRound)
      const room = await this.roomRepository.findOne({
        where: { currentGame: game },
        relations: { scores: { player: true }, players: true },
      })
      this.gameService.sendScore(room)
      this.gameService.sendPlayerList(currentRound, room)
      this.executeRound(gameId)
    } catch (error) {
      this.logger.error(error)
    }
  }
}
