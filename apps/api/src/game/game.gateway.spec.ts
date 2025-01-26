import { Test } from '@nestjs/testing'
import { GameGateway } from './game.gateway'
import { INestApplication } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'
import { CommonModule } from '../common/common.module'
import { UsersModule } from '../users/users.module'
import { AuthModule } from '../auth/auth.module'
import { HttpModule, HttpService } from '@nestjs/axios'
import { GameModule } from './game.module'
async function createNestApp(): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    imports: [GameModule, CommonModule, UsersModule, AuthModule, HttpModule],
    providers: [],
  }).compile()
  return testingModule.createNestApplication()
}

describe('GameGateway ', () => {
  let gateway: GameGateway
  let app: INestApplication
  let ioClient: Socket
  let http: HttpService
  beforeAll(async () => {
    // Instantiate the app
    app = await createNestApp()
    // Get the gateway instance from the app instance
    gateway = app.get<GameGateway>(GameGateway)
    http = new HttpService()
    // Create a new client that will interact with the gateway
    const res = await http.axiosRef.post('http://localhost:3000/auth/guest', {
      username: 'TestUser',
    })
    ioClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        authorization: `bearer ${res.data.access_token}`,
      },
    })

    app.listen(3000)
  })

  afterAll(async () => {
    ioClient.disconnect()
    await app.close()
  })
  it('should be defined', () => {
    expect(gateway).toBeDefined()
  })

  it('should emit receive hello-world on "join-room"', async () => {
    ioClient.connect()
    ioClient.emit('join-room', { roomId: '1234' }, (data: string) => {
      expect(data).toBe('Hello world!ddd')
    })
    await new Promise((resolve) =>
      ioClient.on('yo', (data: any) => {
        resolve(data)
      }),
    )
  })

  it('should reconnect', async () => {
    console.log('// First step')

    ioClient.connect()
    ioClient.emit('join-room', { roomId: '1234' }, (data: string) => {
      expect(data).toBe('Hello world!ddd')
    })
    await new Promise((resolve) =>
      ioClient.on('yo', (data: any) => {
        resolve(data)
      }),
    )
    console.log('// Second step')

    ioClient.disconnect()

    await new Promise((resolve) => {
      setTimeout(() => {
        expect(ioClient.connected).toBe(false)
        ioClient.connect()
        resolve('Disconnected')
      }, 1000)
    })
    await new Promise((resolve) => {
      setTimeout(() => {
        expect(ioClient.connected).toBe(true)
        resolve('reconnected')
      }, 1000)
    })
  })
})
