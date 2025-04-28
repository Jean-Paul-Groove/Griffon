import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm'
import { Player } from '../../player/entities/player.entity'
import { Game } from './game.entity'

@Entity()
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  points: number

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  player: Player

  @ManyToOne(() => Game, (game) => game.scores, { onDelete: 'CASCADE' })
  game: Game

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
