import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';
import SealedSecret from './lib/SealedSecret';
import { sealedSecretsServiceRef } from './service';

export const scaffolderModuleSealedSecrets = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'sealed-secrets',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderTemplatingExtensionPoint,
        sealedSecrets: sealedSecretsServiceRef,
      },
      async init({ scaffolder, sealedSecrets }) {
        const publicKey = await sealedSecrets.getPublicKey()
        scaffolder.addTemplateFilters({
          sealSecret: (...args) => {
            const input = args.join("")
            if(publicKey) {
              const sealedSecret = new SealedSecret(publicKey, input)
              return sealedSecret.sealSecret();
            } else {
              return input
            }
          }
        });
      },
    });
  },
});
