export interface Config {
  openfga?: {
    /**
     * Url to the resource of scope relations. This can be a path to mock data or a backend endpoint.
     * Structure: /:base-url/:scope, where base-url is the host of the backend application.
     * @visibility frontend
     */
    baseUrl?: string;
  };
}