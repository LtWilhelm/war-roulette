declare global {
  interface Crypto {
    randomUUID(): string;
  }
}

export const uuidV4 = window.crypto.randomUUID;
