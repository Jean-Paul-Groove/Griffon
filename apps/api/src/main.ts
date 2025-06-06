import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConsoleLogger, ValidationPipe } from '@nestjs/common'
import multipart from '@fastify/multipart'
import fastifyCookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import { join } from 'path'
async function bootstrap(): Promise<void> {
  const fastify = new FastifyAdapter()
  const logger = new ConsoleLogger()
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastify, {
    logger,
  })

  app.enableCors({
    origin: process.env.FRONT_URL,
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe())
  await app.register(multipart, { limits: { fileSize: 5000000 } })
  await app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET })
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'uploads', 'public'),
    prefix: '/uploads/public',
    decorateReply: false,
    extensions: ['webp'],
  })
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
  logger.log(process.env.PORT ?? 3000)
}
bootstrap()
