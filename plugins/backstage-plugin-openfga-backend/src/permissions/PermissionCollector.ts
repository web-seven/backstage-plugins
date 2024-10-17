import { Config } from '@backstage/config';
import axios from 'axios';
import { LoggerService } from '@backstage/backend-plugin-api';
import { AuthService } from '@backstage/backend-plugin-api';

export class PermissionCollector {
  private config: Config;
  private logger: LoggerService;
  private auth: AuthService;

  constructor(config: Config, logger: LoggerService, auth: AuthService) {
    this.config = config;
    this.logger = logger;
    this.auth = auth;
  }

  public async collectPermissions(): Promise<{ [name: string]: string[] }> {
    const urlsAndPlugins = this.permissionsPaths();
    const permissions: Array<any> = [];

    for (const { url, plugin } of urlsAndPlugins) {
      try {
        const { token } = await this.auth.getPluginRequestToken({
          onBehalfOf: await this.auth.getOwnServiceCredentials(),
          targetPluginId: plugin,
        });

        const result = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (result.data.permissions) {
          permissions.push(...result.data.permissions);
        } else {
          this.logger.error(`No permissions found for plugin: ${plugin}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          this.logger.error(`URL not found for plugin: ${plugin}, URL: ${url}`);
        } else {
          this.logger.error(
            `Error fetching permissions for plugin: ${plugin}, URL: ${url}`,
          );
        }
      }
    }

    if (permissions.length > 0) {
      return this.changeArrayStructure(permissions);
    }
    return {};
  }

  private changeArrayStructure<T extends { name: string }>(
    permissions: Array<T>,
  ): { [name: string]: string[] } {
    const permissionMap: { [name: string]: string[] } = {};

    permissions.forEach((permission: any) => {
      if (permission.name) {
        const parts = permission.name.split('.');
        const action = parts.pop();
        const name = parts.join('.');

        if (action) {
          if (!permissionMap[name]) {
            permissionMap[name] = [];
          }
          permissionMap[name].push(action);
        } else {
          this.logger.error('Permission action is undefined for:', permission);
        }
      } else {
        this.logger.error('Permission name is undefined:', permission);
      }
    });

    return permissionMap;
  }

  private permissionsPaths() {
    const baseurl = this.config.getOptionalString('backend.baseUrl') ?? '';
    const pluginsList =
      this.config.getOptionalStringArray('openfga.plugins') ?? [];
    const paths = [];

    for (const plugin of pluginsList) {
      paths.push({
        url: `${baseurl}/api/${plugin}/.well-known/backstage/permissions/metadata`,
        plugin,
      });
    }

    return paths;
  }
}
