import { Injectable } from '@nestjs/common'
import { User } from './types/User'
import { v4 as uuidv4 } from 'uuid'

// This should be a real class/interface representing a user entity

@Injectable()
export class UsersService {
  private readonly users: User[] = []

  createUser(username: string, avatar?: string): User {
    if (username.trim() != null) {
      const user = { username, avatar, id: uuidv4() }
      this.users.push(user)
      return user
    }
  }
  async get(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id)
  }
}
