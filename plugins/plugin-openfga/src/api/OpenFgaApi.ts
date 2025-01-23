import { ConfigApi, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import {
  TupleGridData,
  Relations,
  SetScopeRelationsResponse,
} from '@web-seven/backstage-plugin-openfga-backend';
import { OpenFgaApi } from '../types';

export default class openFgaApi implements OpenFgaApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly configApi: ConfigApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    configApi: ConfigApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.configApi = options.configApi;
  }

  async getScopeRelations(scope: string, name: string): Promise<TupleGridData> {
    const baseUrl = this.getBaseUrl(scope, name);

    if (baseUrl) {
      const response: TupleGridData = await this.request<TupleGridData>(
        baseUrl,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        },
      );

      if (Object.keys(response).length) {
        return response;
      }
    }
    return {
      resources: [],
      roles: [],
      relations: {},
    };
  }

  async setScopeRelations(
    scope: string,
    name: string,
    relations: Relations,
  ): Promise<SetScopeRelationsResponse> {
    const baseUrl = this.getBaseUrl(scope, name);
    try {
      const response = await this.request<SetScopeRelationsResponse>(baseUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(relations),
      });
      return response;
    } catch (e) {
      throw new Error(`Unable to set scope relations, ${e}`);
    }
  }

  private getBaseUrl(scope: string, name: string): string {
    return this.configApi
      .getString('openfga.baseUrl')
      .replace('/:scope', `/${scope}`)
      .replace('/:name', `/${name}`);
  }

  private async request<T>(path: string, init?: any): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl('openfga')}`;
    const url = path.replace('/:base-url', `${baseUrl}`);
    const response = await this.fetchApi.fetch(url, init);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json() as Promise<T>;
  }
}
