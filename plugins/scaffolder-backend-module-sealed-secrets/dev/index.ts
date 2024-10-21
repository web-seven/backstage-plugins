import SealedSecret from '../src/lib/SealedSecret';
import { SealedSecretsServiceImpl } from '../src/service/SealedSecretsService';

const sealedSecrets = new SealedSecretsServiceImpl();
sealedSecrets.getPublicKey().then(publicKey => {
  if (publicKey) {
    const sealedSecret = new SealedSecret(publicKey, 'test string', '');
    console.log(`
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: mysecret
  namespace: default
  annotations:
    sealedsecrets.bitnami.com/cluster-wide: "true"
spec:
  encryptedData:
    foo: "${sealedSecret.sealSecret()}"
`);
  }
});
