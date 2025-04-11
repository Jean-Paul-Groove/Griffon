import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConsoleLogger } from '@nestjs/common'
async function bootstrap(): Promise<void> {
  const fastify = new FastifyAdapter()
  fastify.enableCors()
  const logger = new ConsoleLogger()
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastify, {
    logger,
  })

  await app.listen(process.env.PORT ?? 3000)
  logger.log(process.env.PORT ?? 3000)
}
bootstrap()
