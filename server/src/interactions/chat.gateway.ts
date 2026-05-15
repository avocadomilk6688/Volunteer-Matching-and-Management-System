import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InteractionsService } from './interactions.service';
import { CreateMessageDto } from './dto/create-interaction.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // For development. Use your frontend URL in production.
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly interactionsService: InteractionsService) {}

  /**
   * Runs when any user connects to the socket.
   */
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * IMPORTANT: Every user should join a room named after their own User ID
   * immediately upon logging in. This allows them to receive 1-on-1 messages
   * and broadcasted announcements.
   */
  @SubscribeMessage('join_private_room')
  handleJoinPrivateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    client.join(data.userId);
    console.log(`User ${data.userId} is now listening for personal messages.`);
  }

  /**
   * For 1-on-1 Active Chat Windows.
   * Joins a room shared by two specific users (e.g., "USR001_USR002").
   */
  @SubscribeMessage('join_chat_session')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    const roomId = [data.senderId, data.receiverId].sort().join('_');
    client.join(roomId);
    console.log(`Chat session started in room: ${roomId}`);
  }

  /**
   * Standard 1-on-1 Messaging.
   */
  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() dto: CreateMessageDto) {
    try {
      // 1. Save to DB using existing service method
      const savedMsg = await this.interactionsService.createMessage(dto);

      // 2. Identify the private chat room
      const roomId = [dto.senderId, dto.receiverId].sort().join('_');

      // 3. Emit to the shared chat room (for the active chat window)
      this.server.to(roomId).emit('receive_message', savedMsg);

      // 4. Also emit directly to the receiver's private ID room
      // (in case they don't have the specific chat window open yet)
      this.server.to(dto.receiverId).emit('new_notification', {
        type: 'CHAT',
        from: dto.senderId,
        content: dto.content,
      });
    } catch (error) {
      console.error('Error in send_message:', error);
    }
  }

  /**
   * Organization Broadcast Logic.
   * Sends the same message to every approved participant of a programme.
   */
  @SubscribeMessage('broadcast_to_programme')
  async handleBroadcast(
    @MessageBody()
    data: {
      programmeId: string;
      senderId: string;
      content: string;
    },
  ) {
    try {
      console.log(`Starting broadcast for programme: ${data.programmeId}`);

      // 1. Call SQL-powered service method
      const { participantUserIds, messages } =
        await this.interactionsService.broadcastToProgramme(
          data.programmeId,
          data.senderId,
          data.content,
        );

      // 2. Loop through every participant and emit to their private room
      participantUserIds.forEach((userId, index) => {
        // We emit the specific Message entity created for that user
        this.server.to(userId).emit('receive_message', messages[index]);
      });

      console.log(
        `Broadcast successfully sent to ${participantUserIds.length} users.`,
      );
    } catch (error) {
      console.error('Error in broadcast_to_programme:', error);
    }
  }
}
