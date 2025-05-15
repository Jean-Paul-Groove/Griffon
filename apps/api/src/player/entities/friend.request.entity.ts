import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Player } from './player.entity'

@Entity()
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  sender: Player

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  receiver: Player

  @Column()
  accepted: boolean

  @Column()
  answered: boolean

  @CreateDateColumn({ select: false })
  createdAt: Date

  @UpdateDateColumn({ select: false })
  updatedAt: Date
}
