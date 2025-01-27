import {
  PolicyDecision,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import { parseEntityRef } from '@backstage/catalog-model';
import { Config } from '@backstage/config';

import { OpenFgaService } from '@web-seven/backstage-backend-plugin-openfga';
import { LoggerService } from '@backstage/backend-plugin-api';

export class OpenFGAPermissionPolicy implements PermissionPolicy {
  constructor(
    private openFgaService: OpenFgaService,
    private logger: LoggerService,
    private config: Config,
  ) {}

  async handle(
    request: PolicyQuery,
    userDetails: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    let result = AuthorizeResult.DENY;
    for (const ownershipRef of userDetails.info.ownershipEntityRefs) {
      const ownership = parseEntityRef(ownershipRef);
      if (ownership.kind === 'group') {
        const groupName = ownership.name;
        if (this.config.getOptionalString('openfga.adminGroup') === groupName) {
          result = AuthorizeResult.ALLOW;
          continue;
        }
        const user = `group:${groupName}`;
        const [resourceName, action] = [
          `${request.permission.name.split('.').slice(0, -1).join('.')}:all`,
          request.permission.name.split('.').pop(),
        ];
        let response;
        try {
          response = await this.openFgaService.checkPermission(
            user,
            action!,
            resourceName,
          );
          result =
            result === AuthorizeResult.DENY && response.allowed
              ? AuthorizeResult.ALLOW
              : AuthorizeResult.DENY;
        } catch (error) {
          this.logger.error(`Error checking permission: ${error}`);
        }
      }
    }
    return { result };
  }
}
