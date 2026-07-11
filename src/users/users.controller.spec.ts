import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call usersService.create and return the result', async () => {
      const createDto: CreateUserDto = {
        name: 'Test',
        email: 'test@example.com',
        cpf: '12345678901',
        password: 'pass',
        birth: '01/01/2000',
        cep: '12345678',
        qualified: 'yes',
      };
      const result = { id: '1', ...createDto };
      mockUsersService.create.mockResolvedValue(result);

      expect(await controller.create(createDto)).toEqual(result);
      expect(mockUsersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the result', async () => {
      const result = [{ id: '1' }];
      mockUsersService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne and return the result', async () => {
      const result = { id: '1' };
      mockUsersService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toEqual(result);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should call usersService.update and return the result', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated' };
      const result = { id: '1', name: 'Updated' };
      mockUsersService.update.mockResolvedValue(result);

      expect(await controller.update('1', updateDto)).toEqual(result);
      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('remove', () => {
    it('should call usersService.remove and return the result', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      expect(await controller.remove('1')).toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });
  });
});
