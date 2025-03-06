import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class GameSpecs {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column()
  description: string

  @Column({ nullable: true })
  illustration: string

  @Column({ nullable: true })
  rules: string

  @Column()
  defaultRoundDuration: number

  @Column()
  pointStep: number

  @Column()
  pointsMax: number

  @Column()
  withGuesses: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
