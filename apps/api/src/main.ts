import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConsoleLogger } from '@nestjs/common'
async function bootstrap(): Promise<void> {
  const fastify = new FastifyAdapter()
  const logger = new ConsoleLogger()
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastify, {
    logger,
  })

  fastify.enableCors({ origin: process.env.FRONT_URL })
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
  logger.log(process.env.PORT ?? 3000)
}
bootstrap()
