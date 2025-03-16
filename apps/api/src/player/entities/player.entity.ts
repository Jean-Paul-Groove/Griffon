import {
  Entity,
  Column,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Message } from '../../message/entities/message.entity'
import { Room } from '../../room/entities/room.entity'
import { Chat } from '../../chat/entities/chat.entity'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 20 })
  name: string

  @ManyToOne(() => Room, (room) => room.players, { nullable: true, onDelete: 'SET NULL' })
  room: Room

  @OneToMany(() => Chat, (message) => message.sender)
  chatMessages: Chat[]

  @Column()
  isGuest: boolean

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true, select: false })
  login: string

  @Column({ select: false, nullable: true })
  password: string

  @Column({ nullable: true })
  avatar: string

  @ManyToMany(() => Player, (user) => user.friends, { nullable: true })
  friends: Player[]

  @OneToMany(() => Message, (message) => message.sender, { nullable: true })
  messagesSent: Message[]

  @OneToMany(() => Message, (message) => message.receiver, { nullable: true })
  messagesReceived: Message[]

  @CreateDateColumn({ select: false })
  createdAt: Date

  @UpdateDateColumn({ select: false })
  updatedAt: Date
}
