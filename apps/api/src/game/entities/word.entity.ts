import { Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Entity } from 'typeorm'

@Entity()
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  value: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
