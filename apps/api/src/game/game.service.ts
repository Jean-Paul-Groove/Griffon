import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class GameService {
  constructor() {}
  private readonly logger = new Logger(GameService.name)
}
