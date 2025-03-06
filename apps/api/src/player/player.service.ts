import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { WsException } from '@nestjs/websockets'
import { CreateGuestDto, PlayerInfoDto } from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'

// This should be a real class/interface representing a user entity

@Injectable()
export class PlayerService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @InjectRepository(Player)
    private userRepository: Repository<Player>,
  ) {}
  private logger = new Logger(PlayerService.name)

  async createGuest(createGuestDto: CreateGuestDto): Promise<Player> {
    if (createGuestDto.name.trim() != '') {
      const userEntity = this.userRepository.create({
        name: createGuestDto.name,
        isGuest: true,
      })
      const user = await this.userRepository.save(userEntity)
      this.logger.log('GUEST CREATED')

      return user
    }
  }

  async get(id: string): Promise<Player> {
    try {
      const guest = await this.userRepository.findOne({
        where: {
          id,
        },
        relations: { room: true },
      })
      if (!guest) {
        throw new Error('Guest not found.')
      }
      this.logger.debug(JSON.stringify(guest))
      return guest
    } catch (error) {
      throw new WsException({ message: error?.message || 'Guest not found.', status: 404 })
    }
  }
  async getPlayerFromSocket(client: Socket): Promise<Player> {
    this.authService.validateWsConnexion(client)
    const user = await this.get(client.data.userId)
    return user
  }
  generatePlauyerInfoDto(player: Player): PlayerInfoDto {
    return new PlayerInfoDto({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      isArtist: true,
      isGuest: player.isGuest,
    })
  }
}
