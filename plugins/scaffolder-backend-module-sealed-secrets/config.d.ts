export interface Config {
  integrations: {
    /**
     * Bitnami Sealed Secrets integration
     * @visibility backend
     */
    sealedSecrets: {
      /**
       * Public key for seal secrets
       * @visibility backend
       */
      publicKey: string | undefined;
    };
  };
}
