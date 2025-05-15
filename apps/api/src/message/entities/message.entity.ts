import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { Player } from '../../player/entities/player.entity'

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  content: string

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  sender: Player

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  receiver: Player

  @Column()
  seen: boolean

  @CreateDateColumn()
  sentAt: Date
}
