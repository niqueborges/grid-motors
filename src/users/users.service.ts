import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import type { IUsersRepository } from './repositories/users.repository';
import type { IAddressProvider } from '../common/providers/address/address-provider.interface';
import type { IHashProvider } from '../common/providers/hash/hash-provider.interface';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    @Inject('IAddressProvider')
    private readonly addressProvider: IAddressProvider,
    @Inject('IHashProvider')
    private readonly hashProvider: IHashProvider,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const [day, month, year] = createUserDto.birth.split('/');
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));

    // CEP lookup using the injected provider
    const addressData = await this.addressProvider.getAddressByCep(
      createUserDto.cep,
    );
    if (!addressData) {
      throw new BadRequestException('Invalid CEP or failed to fetch address');
    }

    const existingUser = await this.usersRepository.findByEmailOrCpf(
      createUserDto.email,
      createUserDto.cpf,
    );

    if (existingUser) {
      throw new BadRequestException(
        'User with this email or CPF already exists',
      );
    }

    const hashedPassword = await this.hashProvider.hash(createUserDto.password);

    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      cpf: createUserDto.cpf,
      password: hashedPassword,
      birth: birthDate,
      cep: createUserDto.cep,
      qualified: createUserDto.qualified,
      street: addressData.street,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
    });

    return user;
  }

  async findAll(): Promise<UserSummaryDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      qualified: user.qualified,
    }));
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  async findOne(id: string, currentUserId: string): Promise<UserProfileDto> {
    if (id !== currentUserId) {
      throw new ForbiddenException(
        'You do not have permission to access this user profile',
      );
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      cpf: user.cpf,
      birth: user.birth,
      email: user.email,
      cep: user.cep,
      qualified: user.qualified,
      street: user.street,
      neighborhood: user.neighborhood,
      city: user.city,
      state: user.state,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<UserEntity> {
    if (id !== currentUserId) {
      throw new ForbiddenException(
        'You do not have permission to update this user account',
      );
    }

    const userExists = await this.usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email || updateUserDto.cpf) {
      const existingUser = await this.usersRepository.findByEmailOrCpf(
        updateUserDto.email,
        updateUserDto.cpf,
      );

      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          'User with this email or CPF already exists',
        );
      }
    }

    const dataToUpdate: Partial<UserEntity> = {};
    const dto = updateUserDto as Partial<CreateUserDto>;

    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.email) dataToUpdate.email = dto.email;
    if (dto.cpf) dataToUpdate.cpf = dto.cpf;
    if (dto.password) {
      dataToUpdate.password = await this.hashProvider.hash(dto.password);
    }
    if (dto.qualified) dataToUpdate.qualified = dto.qualified;

    if (dto.birth) {
      const [day, month, year] = dto.birth.split('/');
      dataToUpdate.birth = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );
    }

    if (dto.cep) {
      dataToUpdate.cep = dto.cep;
      const addressData = await this.addressProvider.getAddressByCep(dto.cep);
      if (!addressData) {
        throw new BadRequestException('Invalid CEP or failed to fetch address');
      }
      dataToUpdate.street = addressData.street;
      dataToUpdate.neighborhood = addressData.neighborhood;
      dataToUpdate.city = addressData.city;
      dataToUpdate.state = addressData.state;
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);
    return updatedUser;
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id !== currentUserId) {
      throw new ForbiddenException(
        'You do not have permission to delete this user account',
      );
    }

    const userExists = await this.usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.delete(id);
  }
}
