import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashProvider } from './hash-provider.interface';

@Injectable()
export class BcryptHashProvider implements IHashProvider {
  async hash(payload: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(payload, saltRounds);
  }

  async compare(payload: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(payload, hashed);
  }
}
