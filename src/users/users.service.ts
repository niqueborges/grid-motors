import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUsersRepository } from './repositories/users.repository';
import axios from 'axios';

// ViaCEP external API response format
interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

function isValidCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/[^\d]+/g, '');
  if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) return false;

  const calc = (n: number) => {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (n + 2 - i);
    }
    let rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === parseInt(cleanCpf.substring(n, n + 1));
  };

  return calc(9) && calc(10);
}

function calculateAge(birthDate: Date): number {
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (!isValidCpf(createUserDto.cpf)) {
      throw new BadRequestException('Invalid CPF format or digit.');
    }

    const [day, month, year] = createUserDto.birth.split('/');
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (calculateAge(birthDate) < 18) {
      throw new BadRequestException('User must be at least 18 years old.');
    }

    let addressData: ViaCepResponse;
    try {
      const response = await axios.get<ViaCepResponse>(
        `https://viacep.com.br/ws/${createUserDto.cep}/json/`,
      );
      addressData = response.data;

      if (addressData.erro) {
        throw new BadRequestException('Invalid CEP');
      }
    } catch {
      throw new BadRequestException('Failed to fetch address from ViaCEP');
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

    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      cpf: createUserDto.cpf,
      password: createUserDto.password,
      birth: birthDate,
      cep: createUserDto.cep,
      qualified: createUserDto.qualified,
      street: addressData.logradouro,
      neighborhood: addressData.bairro,
      city: addressData.localidade,
      state: addressData.uf,
    });

    return user;
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userExists = await this.usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.cpf && !isValidCpf(updateUserDto.cpf)) {
      throw new BadRequestException('Invalid CPF format or digit.');
    }

    if (updateUserDto.birth) {
      const [day, month, year] = updateUserDto.birth.split('/');
      const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
      if (calculateAge(birthDate) < 18) {
        throw new BadRequestException('User must be at least 18 years old.');
      }
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

    let addressData: ViaCepResponse = {};
    if (updateUserDto.cep) {
      try {
        const response = await axios.get<ViaCepResponse>(
          `https://viacep.com.br/ws/${updateUserDto.cep}/json/`,
        );
        addressData = response.data;

        if (addressData.erro) {
          throw new BadRequestException('Invalid CEP');
        }
      } catch {
        throw new BadRequestException('Failed to fetch address from ViaCEP');
      }
    }

    const dto = updateUserDto as Partial<CreateUserDto>;
    const dataToUpdate: {
      name?: string;
      email?: string;
      cpf?: string;
      password?: string;
      birth?: Date;
      cep?: string;
      street?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      qualified?: string;
    } = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.email) dataToUpdate.email = dto.email;
    if (dto.cpf) dataToUpdate.cpf = dto.cpf;
    if (dto.password) dataToUpdate.password = dto.password;
    if (dto.cep) dataToUpdate.cep = dto.cep;
    if (dto.qualified) dataToUpdate.qualified = dto.qualified;

    if (dto.birth) {
      const [day, month, year] = dto.birth.split('/');
      dataToUpdate.birth = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );
    }
    if (addressData.logradouro) {
      dataToUpdate.street = addressData.logradouro;
      dataToUpdate.neighborhood = addressData.bairro;
      dataToUpdate.city = addressData.localidade;
      dataToUpdate.state = addressData.uf;
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);
    return updatedUser;
  }

  async remove(id: string) {
    const userExists = await this.usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.delete(id);
  }
}
