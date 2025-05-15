import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(value: MemoryStorageFile): MemoryStorageFile {
    //If no file we pass the validation
    if (!value) {
      return undefined
    }
    // "value" is an object containing the file's attributes and metadata
    const fiveMo = 5000000
    const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

    if (value.size < fiveMo && acceptedTypes.includes(value.mimetype)) {
      return value
    } else {
      throw new BadRequestException('Incorrect file')
    }
  }
}
