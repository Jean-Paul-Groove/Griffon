import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { Player } from '../../player/entities/player.entity'
import { Room } from '../../room/entities/room.entity'

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column()
  content: string

  @ManyToOne(() => Player, (player) => player.chatMessages, { onDelete: 'CASCADE' })
  sender: Player

  @ManyToOne(() => Room, (Room) => Room.chatMessages, { onDelete: 'CASCADE' })
  room: Room

  @CreateDateColumn()
  sentAt: Date
}
