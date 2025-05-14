import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(value: MemoryStorageFile): MemoryStorageFile {
    // "value" is an object containing the file's attributes and metadata
    const fiveMo = 5000000
    const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

    console.log('INSIDE INTERCEPTOR')
    if (value.size < fiveMo && acceptedTypes.includes(value.mimetype)) {
      return value
    } else {
      console.log('IN THE ELSE')
      console.log(fiveMo)
      console.log(value)
      throw new BadRequestException()
    }
  }
}
