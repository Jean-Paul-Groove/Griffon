import { Game } from '../Game'
import { Room } from '../Room'
import _ from 'lodash'
import { User } from '../../../user/types/User'
import axios from 'axios'
import { RoomService } from '../../room.service'
import { WSE } from 'wse'
export class Griffonary extends Game {
  constructor(room: Room, roomService: RoomService) {
    super(room, 'Griffonary', roomService)
  }
  private wasArtist: string[] = []
  private currentArtist: User | null
  private wordToGuess: string | null
  private playersWhoGuessed: string[] = []
  private pointsToMake: number = 0
  private minimumPoints: number = 50
  private pointsForArtist: number = 50
  private pointStep: number = 50

  async run(): Promise<void> {
    this.logger.debug('RUN')
    // A ROUND LASTS UNTIL EVERYONE WAS AN ARTIST
    if (this.wanabeArtist().length === 0) {
      this.endofRound()
      return
    }
    // SELECT NEW ARTIST
    const newArtist = _.sample(this.wanabeArtist())
    if (!newArtist) {
      throw new Error('NO ARTIST THERE MAN')
    }
    this.setUniqueArtist(newArtist)
    // FETCH NEW WORD TO GUESS FROM EXTERNAL API
    await this.setNewWordToGuess()
    this.emitToPlayer(WSE.WORD_TO_DRAW, this.currentArtist, this.wordToGuess)
    setTimeout(this.endOfDrawing, this.drawingTime)
    this.setDrawingTimeLimit()
    // INITIALIZE POINTS
    this.pointsToMake = 300
    // OPEN GUESSES
    this.canMakeGuess = true
  }
  guessWord(word: string, player: User): void {
    // CHECK IF CAN MAKE A GUESS
    if (
      this.shareDrawing &&
      this.wordToGuess &&
      !this.playersWhoGuessed.includes(player.id) &&
      player != this.currentArtist
    ) {
      // CHECK IF WORD IS CORRECT
      if (word.trim() === this.wordToGuess) {
        // ADD POINTS TO GUESSER
        this.addPointsToPlayer(
          this.pointsToMake > this.minimumPoints ? this.pointsToMake : this.minimumPoints,
          player,
        )
        // ADD POINTS TO ARTIST
        this.addPointsToPlayer(this.pointsForArtist, this.currentArtist)

        // ADD GUESSER TO GUESSERLIST
        this.playersWhoGuessed.push(player.id)

        // DECREASE POINTS TO MAKE
        if (this.pointsToMake > 0) {
          this.pointsToMake -= this.pointStep
        }
      }
    }
  }

  private wanabeArtist(): User[] {
    return this.room.getUsers().filter((player) => this.wasArtist.includes(player.id))
  }
  private setUniqueArtist(player: User): void {
    // SET CURRENT ARTIST AND ALLOW SHARING DRAWINGS
    this.currentArtist = player
    this.shareDrawing = true
    this.logger.debug(`New artist: ${player.name}`)
    // GIVE THE RIGHT TO DRAW ONLY TO ARTIST
    this.room.resetDrawingRights()
    this.room.allowuserToDraw(player.id)

    // TELL THE ARTIST HE CAN DRAW
    this.emitToPlayer(WSE.CAN_DRAW, player)
    // ACTUALISE THE USER LIST OF SOCKETS WITH DRAWING RIGHTS
    this.emitToRoom(WSE.NEW_ARTIST, { users: this.room.getUsers() })
  }
  private endOfDrawing(): void {
    this.logger.debug('END OF DRAWING')

    this.wasArtist.push(this.currentArtist.id)
    this.currentArtist = null
    this.wordToGuess = null
    this.shareDrawing = false
    this.drawingEndTime = null
    this.playersWhoGuessed = []
    this.canMakeGuess = false
    setTimeout(this.run, 5000)
    this.run()
  }
  private addPointsToPlayer(points: number, player: User): void {
    this.scores.set(player.id, this.scores.get(player.id) ?? 0 + points)
    this.emitToRoom(WSE.PLAYER_SCORED, { user: player, points })
  }
  private async setNewWordToGuess(): Promise<void> {
    try {
      const res = await axios.get('https://trouve-mot.fr/api/random')
      this.wordToGuess = res.data.name
      this.logger.debug(`New Word to guess: ${this.wordToGuess}`)
    } catch (err) {
      this.logger.error(err)
    }
  }
}
