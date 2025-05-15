import { Transform } from 'class-transformer'
import { IsNotEmpty, IsPositive, IsString } from 'class-validator'

export class AdminEditGameSpecsDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsString()
  rules: string

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsPositive()
  defaultRoundDuration: number

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsPositive()
  pointStep: number

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsPositive()
  pointsMax: number
}
