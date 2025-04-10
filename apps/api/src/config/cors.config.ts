import { type CorsOptions as corsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

const corsOptions: corsOptions = {
  origin: [process.env.FRONT_URL],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
}

export { corsOptions }
