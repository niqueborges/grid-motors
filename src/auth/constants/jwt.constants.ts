export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'JWT_SECRET environment variable is not defined or is empty.',
    );
  }
  return secret;
}
