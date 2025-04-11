import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConsoleLogger } from '@nestjs/common'
import { corsOptions } from './config/cors.config'
import fastifyHelmet from '@fastify/helmet'
async function bootstrap(): Promise<void> {
  const fastify = new FastifyAdapter()
  const logger = new ConsoleLogger()
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastify, {
    logger,
  })
  await app.register(fastifyHelmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } })
  app.enableCors(corsOptions)
  await app.listen(process.env.PORT ?? 3000)
  logger.log(process.env.PORT ?? 3000)
  logger.log(corsOptions)
}
bootstrap()
