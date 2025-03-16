import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  BeforeUpdate,
} from 'typeorm'
import { Player } from '../../player/entities/player.entity'
import { Score } from '../../game/entities/score.entity'
import { Game } from '../../game/entities/game.entity'
import { Chat } from '../../chat/entities/chat.entity'

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ default: 10 })
  limit: number

  @OneToOne(() => Player, { onUpdate: 'SET NULL', onDelete: 'SET NULL' })
  @JoinColumn()
  admin: Player | null

  @OneToMany(() => Player, (player) => player.room, { orphanedRowAction: 'nullify' })
  players: Player[]

  @OneToMany(() => Score, (score) => score.room, { orphanedRowAction: 'delete' })
  scores: Score[]

  @OneToMany(() => Chat, (message) => message.room, { orphanedRowAction: 'delete' })
  chatMessages: Chat[]

  @OneToOne(() => Game, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  currentGame: Game | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
