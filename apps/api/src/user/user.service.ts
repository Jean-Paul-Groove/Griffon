import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { User } from './types/User'
import { v4 as uuidv4 } from 'uuid'
import { CreateUserDto } from './dto/CreateUserDto'
import { Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { WsException } from '@nestjs/websockets'

// This should be a real class/interface representing a user entity

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
  private readonly users: User[] = []
  private logger = new Logger(UserService.name)
  createUser(createUserDto: CreateUserDto): User {
    if (createUserDto.name.trim() != null) {
      const user = { name: createUserDto.name, avatar: createUserDto.avatar, id: uuidv4() }
      this.users.push(user)
      this.logger.log('USER CREATED')
      return user
    }
  }
  get(id: string): User {
    try {
      const user = this.users.find((user) => user.id === id)
      if (!user) {
        throw new Error('User not found.')
      }
      return user
    } catch (error) {
      throw new WsException({ message: error?.message || 'User not found.', status: 404 })
    }
  }
  getUserFromSocket(client: Socket): User {
    this.authService.validateWsConnexion(client)
    const user = this.get(client.data.userId)
    return user
  }
}
