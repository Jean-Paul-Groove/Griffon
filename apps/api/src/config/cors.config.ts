import { FastifyCorsOptions } from '@fastify/cors'
import { type CorsOptions as corsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

const corsOptions: FastifyCorsOptions = {
  origin: process.env.FRONT_URL,
  credentials: false,
}

export { corsOptions }
