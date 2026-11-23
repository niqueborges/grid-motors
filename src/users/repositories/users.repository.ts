import { UserEntity } from '../entities/user.entity';

export interface UsersQueryResult {
  users: Pick<UserEntity, 'id' | 'name' | 'qualified'>[];
  total: number;
}

export interface IUsersRepository {
  create(data: Partial<UserEntity>): Promise<UserEntity>;
  findAllPaginated(params: {
    limit: number;
    offset: number;
  }): Promise<UsersQueryResult>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmailOrCpf(email?: string, cpf?: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
