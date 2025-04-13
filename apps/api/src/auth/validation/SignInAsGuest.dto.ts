import { IsNotEmpty } from 'class-validator'

export class SignInAsGuestDto {
  @IsNotEmpty()
  username: string
}
