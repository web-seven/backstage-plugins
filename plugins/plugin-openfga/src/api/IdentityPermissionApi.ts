import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { PermissionApi } from '@backstage/plugin-permission-react';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  PermissionClient,
} from '@backstage/plugin-permission-common';
import { Config } from '@backstage/config';
import { AlertApi } from '@backstage/core-plugin-api';

/**
 * The default implementation of the PermissionApi, which simply calls the authorize method of the given
 * {@link @backstage/plugin-permission-common#PermissionClient}.
 * @public
 */
export class IdentityPermissionApi implements PermissionApi {
  private constructor(
    private readonly permissionClient: PermissionClient,
    private readonly identityApi: IdentityApi,
    private readonly alertApi: AlertApi,
  ) {}
  static create(options: {
    config: Config;
    discovery: DiscoveryApi;
    identity: IdentityApi;
    alertApi: AlertApi;
  }) {
    const { config, discovery, identity, alertApi } = options;
    const permissionClient = new PermissionClient({ discovery, config });
    return new IdentityPermissionApi(permissionClient, identity, alertApi);
  }

  async authorize(
    request: AuthorizePermissionRequest,
  ): Promise<AuthorizePermissionResponse> {
    const response = await this.permissionClient.authorize(
      [request],
      await this.identityApi.getCredentials(),
    );

    if (response[0].result === 'DENY') {
      this.alertApi.post({
        message: `To use this page you also need permissions for: ${request.permission.name}`,
        severity: 'info',
      });
    }

    return response[0];
  }
}
