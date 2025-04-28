import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Column,
} from 'typeorm'
import { GameSpecs } from './game.specs.entity'
import { Round } from './round.entity'
import { Room } from '../../room/entities/room.entity'
import { Score } from './score.entity'

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => GameSpecs)
  specs: GameSpecs

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  room: Room

  @OneToMany(() => Round, (round) => round.game)
  rounds: Round[]

  @Column({ nullable: true })
  roundDuration: number

  @OneToMany(() => Score, (score) => score.game, { orphanedRowAction: 'delete' })
  scores: Score[]

  @Column()
  onGoing: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
