export interface SealedSecretsService {
  getPublicKey(): Promise<string | undefined>;
}