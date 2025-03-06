import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm'
import { Player } from '../../player/entities/player.entity'
import { Room } from '../../room/entities/room.entity'

@Entity()
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  points: number

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  player: Player

  @ManyToOne(() => Room, (room) => room.scores, { onDelete: 'CASCADE' })
  room: Room

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
