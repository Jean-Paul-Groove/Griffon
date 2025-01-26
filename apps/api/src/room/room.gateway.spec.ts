import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'
import { CommonModule } from '../common/common.module'
import { HttpService } from '@nestjs/axios'
import { RoomModule } from './room.module'
import { RoomGateway } from './room.gateway'
import { SocketEventsEnum as WSE } from './events/SocketEvents.enum'
async function createNestApp(): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    imports: [RoomModule, CommonModule],
    providers: [],
  }).compile()
  return testingModule.createNestApplication()
}

describe('RoomGateway ', () => {
  let gateway: RoomGateway
  let app: INestApplication
  let ioClient: Socket
  let http: HttpService
  beforeAll(async () => {
    // Instantiate the app
    app = await createNestApp()
    // Get the gateway instance from the app instance
    gateway = app.get<RoomGateway>(RoomGateway)
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
      ioClient.on(WSE.USER_JOINED_ROOM_SUCCESS, (data: any) => {
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
      ioClient.on(WSE.USER_JOINED_ROOM_SUCCESS, (data: any) => {
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
