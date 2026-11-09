import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Route Security and Authentication Metadata', () => {
    it('should keep create endpoint public (no JwtAuthGuard)', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const targetMethod = controller.create;
      const guards = Reflect.getMetadata(
        '__guards__',
        targetMethod,
      ) as unknown[];
      expect(guards).toBeUndefined();
    });

    it('should protect findAll, findOne, update, and remove with JwtAuthGuard', () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const protectedHandlers = [
        controller.findAll,
        controller.findOne,
        controller.update,
        controller.remove,
      ];
      /* eslint-enable @typescript-eslint/unbound-method */

      for (const handler of protectedHandlers) {
        const guards = Reflect.getMetadata('__guards__', handler) as unknown[];
        expect(guards).toBeDefined();
        expect(guards).toContain(JwtAuthGuard);
      }
    });
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
      const result = { id: validUuid, ...createDto };
      mockUsersService.create.mockResolvedValue(result);

      expect(await controller.create(createDto)).toEqual(result);
      expect(mockUsersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the minimal projection', async () => {
      const result = [{ id: validUuid, name: 'Test User', qualified: 'yes' }];
      mockUsersService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should forward valid UUID and currentUserId to service and return user', async () => {
      const result = { id: validUuid, name: 'Test User' };
      mockUsersService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(validUuid, validUuid)).toEqual(result);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        validUuid,
        validUuid,
      );
    });
  });

  describe('update', () => {
    it('should forward valid UUID, updateDto, and currentUserId to service', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated' };
      const result = { id: validUuid, name: 'Updated' };
      mockUsersService.update.mockResolvedValue(result);

      expect(await controller.update(validUuid, updateDto, validUuid)).toEqual(
        result,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(
        validUuid,
        updateDto,
        validUuid,
      );
    });
  });

  describe('remove', () => {
    it('should forward valid UUID and currentUserId to service and remove user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      expect(await controller.remove(validUuid, validUuid)).toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(
        validUuid,
        validUuid,
      );
    });
  });
});
