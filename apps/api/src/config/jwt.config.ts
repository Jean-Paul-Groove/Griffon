export default (): JWTConfig => ({
  global: true,
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRY },
})
interface JWTConfig {
  global: boolean
  secret: string
  signOptions: { expiresIn: string }
}
