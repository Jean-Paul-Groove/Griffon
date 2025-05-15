import { IsOptional, IsString } from 'class-validator'

export class EditPlayerDto {
  @IsString()
  @IsOptional()
  password: string

  @IsString()
  @IsOptional()
  name: string
}
