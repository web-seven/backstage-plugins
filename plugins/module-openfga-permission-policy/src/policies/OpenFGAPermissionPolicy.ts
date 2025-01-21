import {
  PolicyDecision,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';

import { OpenFgaService } from '@web-seven/backstage-backend-plugin-openfga';
import { LoggerService } from '@backstage/backend-plugin-api';

export class OpenFGAPermissionPolicy implements PermissionPolicy {
  private logger: LoggerService;
  private openFgaService: OpenFgaService;
  constructor(openFgaService: OpenFgaService, logger: LoggerService) {
    this.openFgaService = openFgaService;
    this.logger = logger;
  }

  async handle(
    request: PolicyQuery,
    userDetails: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    const user = `group:${userDetails.info.userEntityRef.split('/').pop()}`;
    const [resourceName, action] = [
      `${request.permission.name.split('.').slice(0, -1).join('.')}:all`,
      request.permission.name.split('.').pop(),
    ];
    let result;
    try {
      result = await this.openFgaService.checkPermission(
        user,
        action!,
        resourceName,
      );
      return {
        result: result.allowed ? AuthorizeResult.ALLOW : AuthorizeResult.DENY,
      };
    } catch (error) {
      this.logger.error(`Error checking permission: ${error}`);

      return { result: AuthorizeResult.DENY };
    }
  }
}
