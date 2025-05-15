import {
  Entity,
  Column,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm'
import { Room } from '../../room/entities/room.entity'
import { Chat } from '../../chat/entities/chat.entity'
import { UserRole } from 'shared'

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 20 })
  name: string

  @ManyToOne(() => Room, (room) => room.players, { nullable: true, onDelete: 'SET NULL' })
  room: Room

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  role: UserRole

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, select: false })
  email: string

  @Column({ select: false, nullable: true })
  password: string

  @Column({ nullable: true })
  avatar: string

  @ManyToMany(() => Player)
  @JoinTable()
  friends: Player[]

  @CreateDateColumn({ select: false })
  createdAt: Date

  @UpdateDateColumn({ select: false })
  updatedAt: Date
}
