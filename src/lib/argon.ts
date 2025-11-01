import argon2 from "argon2";

export const hashPassword = async (password: string) => {
  try {
    // Argon2id adalah varian paling direkomendasikan
    return await argon2.hash(password, { type: argon2.argon2id });
  } catch (err) {
    throw new Error("Failed to hash password");
  }
};

export const comparePassword = async (password: string, hash: string) => {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    throw new Error("Failed to verify password");
  }
};
