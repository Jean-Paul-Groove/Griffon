import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WsFilter } from './ws/ws.filter'

@Module({
  exports: [WsFilter],
  providers: [WsFilter],
  imports: [HttpModule],
})
export class CommonModule {}
