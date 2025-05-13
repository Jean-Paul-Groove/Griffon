import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { Player } from '../../player/entities/player.entity'

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  content: string

  @ManyToOne(() => Player, (player) => player.messagesSent)
  sender: Player

  @ManyToOne(() => Player, (player) => player.messagesReceived)
  receiver: Player

  @Column()
  seen: boolean

  @CreateDateColumn()
  sentAt: Date
}
