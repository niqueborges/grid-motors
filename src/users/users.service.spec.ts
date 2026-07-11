import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmailOrCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAddressProvider = {
    getAddressByCep: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUsersRepository',
          useValue: mockUsersRepository,
        },
        {
          provide: 'IAddressProvider',
          useValue: mockAddressProvider,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
