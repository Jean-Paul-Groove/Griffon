import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConsoleLogger } from '@nestjs/common'
import { corsOptions } from './config/cors.config'
async function bootstrap(): Promise<void> {
  const fastify = new FastifyAdapter()
  fastify.enableCors(corsOptions)
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastify, {
    logger: new ConsoleLogger(),
  })
  await app.listen(process.env.PORT ?? 3000)
  console.info('STARTED ON PORT ' + (process.env.PORT ?? 3000))
}
bootstrap()
