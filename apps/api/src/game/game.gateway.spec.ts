import { Test } from '@nestjs/testing'
import { GameGateway } from './game.gateway'
import { INestApplication } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'
import { JwtService } from '@nestjs/jwt'
import { RoomService } from '../common/room/room.service'
import { UsersService } from '../users/users.service'
import http from 'http'
async function createNestApp(): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: [GameGateway, JwtService, RoomService, UsersService],
  }).compile()
  return testingModule.createNestApplication()
}

describe('GameGateway', () => {
  let gateway: GameGateway
  let app: INestApplication
  let ioClient: Socket
  beforeAll(async () => {
    // Instantiate the app
    app = await createNestApp()
    // Get the gateway instance from the app instance
    gateway = app.get<GameGateway>(GameGateway)
    // Create a new client that will interact with the gateway
    ioClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        authorization:
          'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYwMGNlNjI4LTZlNDktNDdjYy04MTFiLTEwZWYzZmM3MjZkZSIsImlhdCI6MTczNzY3MzA3OSwiZXhwIjoxNzM3NzE2Mjc5fQ.Zv9OGBORJwMvzwiKgdjKz8Pu5X6leC4LQU1O2liHfXU',
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
    const data: any = await new Promise((resolve) =>
      ioClient.on('yo', (data: any) => {
        resolve(data)
      }),
    )
    console.log('TEST: data: ', data.users)
  })
})
