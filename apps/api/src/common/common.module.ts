import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WsFilter } from './ws/ws.filter'
import { CommonService } from './common.service'

@Module({
  exports: [WsFilter, CommonService],
  providers: [WsFilter, CommonService],
  imports: [HttpModule],
})
export class CommonModule {}
