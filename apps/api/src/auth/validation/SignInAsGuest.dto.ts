import { IsNotEmpty, IsString } from 'class-validator'

export class SignInAsGuestDto {
  @IsNotEmpty()
  @IsString()
  username: string
}
