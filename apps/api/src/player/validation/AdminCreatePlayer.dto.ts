import { IsIn, IsNotEmpty, IsString } from 'class-validator'
import { UserRole } from 'shared'

export class AdminCreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsIn([UserRole.ADMIN, UserRole.REGISTERED_USER])
  role: UserRole.ADMIN | UserRole.REGISTERED_USER
}
