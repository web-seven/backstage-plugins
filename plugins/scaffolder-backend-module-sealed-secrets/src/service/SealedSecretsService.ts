import { SealedSecretsService } from "./types";
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { pki } from 'node-forge';
import http from 'http'
import { ServiceRef, createServiceFactory, createServiceRef } from "@backstage/backend-plugin-api";

export class SealedSecretsServiceImpl implements SealedSecretsService {

  private readonly namespace = "kube-system"
  private readonly service = "http:sealed-secrets-controller:http"
  private readonly path = "/v1/cert.pem"

  async getPublicKey(): Promise<string | undefined> {
    let kc = new KubeConfig();
    kc.loadFromDefault();
    let k8sCoreApi = kc.makeApiClient(CoreV1Api)
    let data: { response: http.IncomingMessage, body: string } = 
      await k8sCoreApi.connectGetNamespacedServiceProxyWithPath(
        this.service, this.namespace, this.path
      )
    if (data.response.statusCode == 200) {
      let pem = data.body
      const cert = pki.certificateFromPem(pem)
      return pki.publicKeyToPem(cert.publicKey);
    }
    return undefined
  }
}

export const sealedSecretsServiceRef: ServiceRef<SealedSecretsService> =
  createServiceRef<SealedSecretsService>({
    id: 'sealedSecrets.service',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {},
        async factory() {
          return new SealedSecretsServiceImpl();
        },
      }),
  });