import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(value: MemoryStorageFile): MemoryStorageFile {
    //If no file we pass the validation
    console.log(value)
    if (!value) {
      console.log('IN HEEEERE')
      return undefined
    }
    // "value" is an object containing the file's attributes and metadata
    const fiveMo = 5000000
    const acceptedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

    if (value.size < fiveMo && acceptedTypes.includes(value.mimetype)) {
      return value
    } else {
      console.log(value.size)
      console.log(value.mimetype)
      throw new BadRequestException('Incorrect file')
    }
  }
}
