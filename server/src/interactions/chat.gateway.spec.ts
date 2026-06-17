import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { InteractionsService } from './interactions.service';
import { Socket, Server } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let service: InteractionsService;

  const mockInteractionsService = {
    createMessage: jest.fn(),
    broadcastToProgramme: jest.fn(),
  };

  const mockSocket = {
    id: 'socket_id_123',
    join: jest.fn(),
    leave: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Server;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: InteractionsService,
          useValue: mockInteractionsService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    service = module.get<InteractionsService>(InteractionsService);
    gateway.server = mockServer; // Inject mock Server
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleJoinPrivateRoom', () => {
    it('should join the user private room matching user ID', () => {
      gateway.handleJoinPrivateRoom(mockSocket, { userId: 'U001' });

      expect(mockSocket.join).toHaveBeenCalledWith('U001');
    });
  });

  describe('handleJoinChatSession', () => {
    it('should join the combined chat room in alphabetically sorted order with program ID', () => {
      gateway.handleJoinChat(mockSocket, {
        senderId: 'U002',
        receiverId: 'U001',
        programmeId: 'P001',
      });

      // U001_U002_P001
      expect(mockSocket.join).toHaveBeenCalledWith('U001_U002_P001');
    });

    it('should default to general room if programmeId is missing', () => {
      gateway.handleJoinChat(mockSocket, {
        senderId: 'U002',
        receiverId: 'U001',
      });

      expect(mockSocket.join).toHaveBeenCalledWith('U001_U002_general');
    });
  });

  describe('handleMessage', () => {
    it('should sanitize support ticket program IDs and broadcast the saved message', async () => {
      const dto = {
        senderId: 'U001',
        receiverId: 'U002',
        content: 'Help me please',
        programmeId: 'T002', // Support ticket
      };

      const mockSavedMessage = {
        id: 'M001',
        content: 'Help me please',
        sender: { id: 'U001' },
        receiver: { id: 'U002' },
        programme: undefined, // cleared
      };

      mockInteractionsService.createMessage.mockResolvedValue(mockSavedMessage);

      await gateway.handleMessage(dto);

      // Verify DB save cleans the support ticket ID
      expect(service.createMessage).toHaveBeenCalledWith({
        senderId: 'U001',
        receiverId: 'U002',
        content: 'Help me please',
        programmeId: undefined, // Cleared because it starts with 'T'
      });

      // Verify broadcast is sent to the original support ticket room (T002)
      expect(mockServer.to).toHaveBeenCalledWith('U001_U002_T002');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'receive_message',
        mockSavedMessage,
      );

      // Verify receiver is notified in their private room
      expect(mockServer.to).toHaveBeenCalledWith('U002');
      expect(mockServer.emit).toHaveBeenCalledWith('new_notification', {
        type: 'CHAT',
        from: 'U001',
        content: 'Help me please',
        programmeId: 'T002',
      });
    });
  });

  describe('handleBroadcast', () => {
    it('should broadcast a single message down to all programme participants', async () => {
      const mockResult = {
        participantUserIds: ['U002', 'U003'],
        messages: [
          { id: 'M001', content: 'Alert', receiver: { id: 'U002' } },
          { id: 'M002', content: 'Alert', receiver: { id: 'U003' } },
        ],
      };
      mockInteractionsService.broadcastToProgramme.mockResolvedValue(
        mockResult,
      );

      await gateway.handleBroadcast({
        programmeId: 'P001',
        senderId: 'O001',
        content: 'Alert',
      });

      expect(service.broadcastToProgramme).toHaveBeenCalledWith(
        'P001',
        'O001',
        'Alert',
      );
      expect(mockServer.to).toHaveBeenCalledWith('U002');
      expect(mockServer.to).toHaveBeenCalledWith('U003');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });
  });
});
