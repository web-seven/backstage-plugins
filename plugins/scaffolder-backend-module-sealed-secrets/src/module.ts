import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import SealedSecret from './lib/SealedSecret';
import { sealedSecretsServiceRef } from './service';

const CONFIG_KEY = 'integration.sealedSecrets.publicKey';

export const scaffolderModuleSealedSecrets = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'sealed-secrets',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderTemplatingExtensionPoint,
        sealedSecrets: sealedSecretsServiceRef,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, sealedSecrets, config }) {
        const publicKey = config.has(CONFIG_KEY)
          ? config.getString(CONFIG_KEY)
          : await sealedSecrets.getPublicKey();

        scaffolder.addTemplateFilters({
          sealSecret: (...args) => {
            const input = args.join('');
            if (publicKey) {
              const sealedSecret = new SealedSecret(publicKey, input);
              return sealedSecret.sealSecret();
            }
            return input;
          },
        });
      },
    });
  },
});
