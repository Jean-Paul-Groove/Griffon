import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
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
    private playerRepository: Repository<Player>,
  ) {}
  private logger = new Logger(PlayerService.name)

  async createGuest(createGuestDto: CreateGuestDto): Promise<Player> {
    if (createGuestDto.name.trim() != '') {
      const userEntity = this.playerRepository.create({
        name: createGuestDto.name,
        isGuest: true,
      })
      const user = await this.playerRepository.save(userEntity)
      this.logger.log('GUEST CREATED')
      return user
    }
  }

  async get(playerId: string): Promise<Player | undefined> {
    const guest = await this.playerRepository.findOne({
      where: {
        id: playerId,
      },
      relations: { room: true },
    })
    return guest
  }
  async getPlayerFromSocket(client: Socket): Promise<Player | undefined> {
    this.authService.validateWsConnexion(client)
    const player = await this.get(client.data.playerId)
    return player
  }
  generatePlayerInfoDto(player: Player, artists: string[]): PlayerInfoDto {
    return new PlayerInfoDto({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      isArtist: artists.includes(player.id),
      isGuest: player.isGuest,
      room: player.room?.id,
    })
  }
}
