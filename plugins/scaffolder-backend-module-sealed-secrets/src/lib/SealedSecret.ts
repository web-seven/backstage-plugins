import * as crypto from 'crypto';

export default class SealedSecret {

  private SESSION_KEY_LENGTH = 32;

  private AES_GCM_NONCE_SIZE = 12;

  constructor(
    readonly publicKey: string, 
    private readonly secret: string,
    readonly label: string = ''
  )
  {}

  public sealSecret():string {
    const sessionKey = crypto.randomBytes(this.SESSION_KEY_LENGTH);
    const rsaCipherText = crypto.publicEncrypt( {
          key: this.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
      },
      sessionKey
    );
    const rsaCipherLength = new Uint8Array([rsaCipherText.length / 256, rsaCipherText.length % 256]);
    const result = this.encrypt(sessionKey);
    const resultBuffer = new Uint8Array(rsaCipherLength.byteLength + rsaCipherText.byteLength + result.byteLength);
    resultBuffer.set(new Uint8Array(rsaCipherLength), 0);
    resultBuffer.set(new Uint8Array(rsaCipherText), rsaCipherLength.byteLength);
    resultBuffer.set(new Uint8Array(result), rsaCipherLength.byteLength + rsaCipherText.byteLength);
    return Buffer.from(resultBuffer.buffer).toString('base64');
  }

  private encrypt(sessionKey: Buffer): ArrayBuffer {
    const nonce = Buffer.alloc(this.AES_GCM_NONCE_SIZE, 0);
    const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, nonce);
    let encrypted = Buffer.concat([cipher.update(this.secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = Buffer.concat([encrypted, authTag]);
    const arrayBuffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    return arrayBuffer;
  }

}