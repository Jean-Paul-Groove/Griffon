import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

const corsOptions: CorsOptions = {
  origin: [process.env.FRONT_URL],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
  maxAge: 86400,
}

export { corsOptions }
