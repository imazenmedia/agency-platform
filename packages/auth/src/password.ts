import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Appropriate cost factor for modern systems

export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (!plaintext || !hash) {
    return false;
  }
  return bcrypt.compare(plaintext, hash);
}
