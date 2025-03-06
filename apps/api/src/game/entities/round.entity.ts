import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { Game } from './game.entity'
import { Word } from './word.entity'
import { Player } from '../../player/entities/player.entity'

@Entity()
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Game, { cascade: ['remove', 'soft-remove', 'recover'] })
  game: Game

  @ManyToOne(() => Word)
  word: Word

  @ManyToMany(() => Player)
  @JoinTable()
  artists: Player[]

  @ManyToMany(() => Player)
  @JoinTable()
  haveGuessed: Player[]

  @Column()
  onGoing: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
