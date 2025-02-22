import { Game } from '../Game'
import { Room } from '../Room'
import { RoomService } from '../../room.service'
import { WSE } from 'wse'
import { Player } from 'dto'
import { sample } from 'lodash'
import { WORD_BANK } from './wordBank/wordBank'
export class Griffonary extends Game {
  constructor(room: Room, roomService: RoomService) {
    super(room, 'Griffonary', roomService)
    this.drawingTime = 90000
  }
  private wasArtist: string[] = []
  private currentArtist: Player | null
  private wordToGuess: string | null
  private playersWhoGuessed: string[] = []
  private pointsToMake: number = 0
  private minimumPoints: number = 50
  private pointsForArtist: number = 50
  private pointStep: number = 50

  async run(): Promise<void> {
    this.logger.debug('RUN')
    const artists = [...this.wanabeArtist()]
    // A ROUND LASTS UNTIL EVERYONE WAS AN ARTIST
    this.logger.debug(artists)
    if (artists.length === 0) {
      this.wasArtist = []
      this.endofRound()
      return
    }
    // SELECT NEW ARTIST
    const newArtist = sample(artists)
    if (!newArtist) {
      throw new Error('NO ARTIST THERE MAN')
    }
    this.setUniqueArtist(newArtist)
    // FETCH NEW WORD TO GUESS FROM EXTERNAL API
    await this.setNewWordToGuess()
    this.emitToPlayer(WSE.WORD_TO_DRAW, this.currentArtist, this.wordToGuess)
    setTimeout(() => this.endOfDrawing(), this.drawingTime)
    this.setDrawingTimeLimit()
    // INITIALIZE POINTS
    this.pointsToMake = 300
    // OPEN GUESSES
    this.canMakeGuess = true
  }
  guessWord(word: string, player: Player): void {
    // CHECK IF CAN MAKE A GUESS
    if (
      this.shareDrawing &&
      this.wordToGuess &&
      !this.playersWhoGuessed.includes(player.id) &&
      player != this.currentArtist
    ) {
      // CHECK IF WORD IS CORRECT
      if (word.trim().toUpperCase() === this.wordToGuess.toUpperCase()) {
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

  private wanabeArtist(): Player[] {
    return this.room.getPlayers().filter((player) => !this.wasArtist.includes(player.id))
  }
  private setUniqueArtist(player: Player): void {
    // SET CURRENT ARTIST AND ALLOW SHARING DRAWINGS
    this.currentArtist = player
    this.shareDrawing = true
    this.logger.debug(`New artist: ${player.name}`)
    // GIVE THE RIGHT TO DRAW ONLY TO ARTIST
    this.room.resetDrawingRights()
    this.room.allowPlayerToDraw(player.id)

    // TELL THE ARTIST HE CAN DRAW
    this.emitToPlayer(WSE.CAN_DRAW, player, player)
    // ACTUALISE THE USER LIST OF SOCKETS WITH DRAWING RIGHTS
    this.emitToRoom(WSE.NEW_ARTIST, { users: this.room.getPlayers() })
  }
  private endOfDrawing(): void {
    // this.logger.debug('END of DRAWING')
    this.wasArtist.push(this.currentArtist.id)
    this.emitToPlayer(WSE.STOP_DRAW, this.currentArtist)
    this.currentArtist = null
    this.wordToGuess = null
    this.shareDrawing = false
    this.drawingEndTime = null
    this.playersWhoGuessed = []
    this.canMakeGuess = false
    this.emitToRoom(WSE.PLAYER_LIST, { players: this.room.getPlayers() })
    this.emitToRoom(WSE.TIME_LIMIT, Date.now() + 5000)
    setTimeout(() => this.run(), 5000)
  }
  private addPointsToPlayer(points: number, player: Player): void {
    this.room.getPlayer(player.id).points += points
    this.emitToRoom(WSE.PLAYER_SCORED, { player, points })
  }
  private async setNewWordToGuess(): Promise<void> {
    try {
      this.wordToGuess = sample(WORD_BANK)
      this.logger.debug(`New Word to guess: ${this.wordToGuess}`)
    } catch (err) {
      this.logger.error(err)
    }
  }
}
