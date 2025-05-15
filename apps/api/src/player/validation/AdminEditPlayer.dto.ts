import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { UserRole } from 'shared'
export class AdminEditPlayerDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsString()
  @IsOptional()
  password: string

  @IsString()
  @IsOptional()
  name: string

  @IsString()
  @IsOptional()
  email: string

  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.REGISTERED_USER])
  role: UserRole.ADMIN | UserRole.REGISTERED_USER
}
