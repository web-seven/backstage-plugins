import { createApiRef } from '@backstage/core-plugin-api';
import { OpenFgaApi } from '../types';

/** @public */
export const openfgaApiRef = createApiRef<OpenFgaApi>({
  id: 'plugin.openfga',
});
