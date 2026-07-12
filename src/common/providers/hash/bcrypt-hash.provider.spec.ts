import { BcryptHashProvider } from './bcrypt-hash.provider';

describe('BcryptHashProvider', () => {
  let provider: BcryptHashProvider;

  beforeEach(() => {
    provider = new BcryptHashProvider();
  });

  describe('hash', () => {
    it('should return a hashed string different from the original', async () => {
      const original = 'my-secret-password';
      const hashed = await provider.hash(original);
      expect(hashed).not.toBe(original);
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same input (salt)', async () => {
      const original = 'same-password';
      const hash1 = await provider.hash(original);
      const hash2 = await provider.hash(original);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true when comparing original with its hash', async () => {
      const original = 'correct-password';
      const hashed = await provider.hash(original);
      const result = await provider.compare(original, hashed);
      expect(result).toBe(true);
    });

    it('should return false when comparing wrong password with hash', async () => {
      const original = 'correct-password';
      const hashed = await provider.hash(original);
      const result = await provider.compare('wrong-password', hashed);
      expect(result).toBe(false);
    });
  });
});
