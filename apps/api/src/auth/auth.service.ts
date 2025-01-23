import { Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signInAsGuest(username: string): Promise<{ access_token: string }> {
    // TODO: Generate a JWT and return it here
    // instead of the user object
    const user = this.usersService.createUser(username)
    const payload = { id: user.id }
    return {
      access_token: await this.jwtService.signAsync(payload),
    }
  }
}
