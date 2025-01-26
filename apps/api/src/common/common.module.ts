import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

@Module({
  exports: [],
  imports: [HttpModule],
})
export class CommonModule {}
