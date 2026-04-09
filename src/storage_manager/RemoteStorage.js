/**
 * RemoteStorage - Storage adapter using HTTP requests
 *
 * Persists editor project data to a remote server via REST API.
 * Supports configurable URLs, methods, headers, and credentials.
 */

export default class RemoteStorage {
  /**
   * @param {Object} [config={}]
   * @param {string} [config.urlStore=''] - URL endpoint for storing data (POST/PUT)
   * @param {string} [config.urlLoad=''] - URL endpoint for loading data (GET)
   * @param {Object} [config.headers={}] - Custom HTTP headers
   * @param {Object} [config.params={}] - Additional request parameters
   * @param {string} [config.contentTypeJson='application/json'] - Content type for JSON
   * @param {string} [config.credentials='include'] - Credentials mode
   * @param {string} [config.fetchOptions={}] - Additional fetch options
   */
  constructor(config = {}) {
    /** @type {string} Store endpoint URL */
    this.urlStore = config.urlStore || '';

    /** @type {string} Load endpoint URL */
    this.urlLoad = config.urlLoad || '';

    /** @type {Object} Custom HTTP headers */
    this.headers = config.headers || {};

    /** @type {Object} Additional parameters */
    this.params = config.params || {};

    /** @type {string} Content type */
    this.contentType = config.contentTypeJson || 'application/json';

    /** @type {string} Credentials mode */
    this.credentials = config.credentials || 'include';

    /** @type {Object} Extra fetch options */
    this.fetchOptions = config.fetchOptions || {};
  }

  /**
   * Store data to the remote server
   * @param {Object} data - Data object to persist
   * @param {Object} [opts={}]
   * @param {string} [opts.url] - Override store URL
   * @param {string} [opts.method='POST'] - HTTP method
   * @returns {Promise<Object>} Server response
   */
  async store(data, opts = {}) {
    const url = opts.url || this.urlStore;
    if (!url) {
      throw new Error('[RemoteStorage] No store URL configured');
    }

    const method = opts.method || 'POST';
    const body = JSON.stringify({ ...this.params, ...data });

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': this.contentType,
        ...this.headers,
        ...(opts.headers || {}),
      },
      credentials: this.credentials,
      body,
      ...this.fetchOptions,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`[RemoteStorage] Store failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return {};
  }

  /**
   * Load data from the remote server
   * @param {Object} [opts={}]
   * @param {string} [opts.url] - Override load URL
   * @returns {Promise<Object>} Loaded data
   */
  async load(opts = {}) {
    const url = opts.url || this.urlLoad;
    if (!url) {
      throw new Error('[RemoteStorage] No load URL configured');
    }

    // Append params as query string
    const queryParams = { ...this.params, ...(opts.params || {}) };
    const queryString = Object.entries(queryParams)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...this.headers,
        ...(opts.headers || {}),
      },
      credentials: this.credentials,
      ...this.fetchOptions,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`[RemoteStorage] Load failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return {};
  }
}
