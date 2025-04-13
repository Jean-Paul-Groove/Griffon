import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { Injectable, Logger } from '@nestjs/common'
import * as path from 'path'
import * as sharp from 'sharp'
import fs from 'fs'
@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name)

  async uploadImage(
    image: MemoryStorageFile,
    playerId: string,
    shared: boolean,
    filePrefix: string,
    pictureSize?: number,
  ): Promise<string> {
    const size = pictureSize || 800
    if (!image) {
      return null
    }
    this.logger.debug('UPLOAD')
    const filename = filePrefix + '-' + playerId + '.webp'
    let location = ''
    if (shared) {
      location = path.join('uploads', 'public', filename)
    } else {
      this.createDirectoryIfNotExist(path.join('uploads', 'private', playerId))
      location = path.join('uploads', 'private', playerId, filename)
    }
    this.logger.debug(location)
    this.logger.debug(filename)
    this.logger.debug(image)
    const img = sharp(image.buffer).resize(size).webp()
    await img.toFile(location)

    return location
  }
  private createDirectoryIfNotExist(location: string): boolean {
    try {
      if (!fs.existsSync(location)) {
        fs.mkdirSync(location)
      }
      return true
    } catch (err) {
      this.logger.error(err)
      return false
    }
  }
}
