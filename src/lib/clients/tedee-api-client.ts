
import axios from 'axios';
import qs from 'qs';

import { Platform } from '../platform';
import { TokenResponse } from './models/token-response';
import { Lock } from './models/lock';
import { LocksResponse } from './models/locks-response';
import { LockSync } from './models/lock-sync';
import { LocksSyncResponse } from './models/locks-sync-response';
import { LockSyncResponse } from './models/lock-sync-response';
import { OperationResponse } from './models/operation-response';
import { OperationStatus } from './models/operation-status';

/**
 * Represents a client that communicates with the Tedee HTTP API.
 */
export class TedeeApiClient {

    /**
     * Initializes a new TedeeApiClient instance.
     * @param platform The platform of the plugin.
     */
    constructor(private platform: Platform) { }

    /**
     * Contains the expiration date time for the access token.
     */
    private expirationDateTime: Date|null = null;

    /**
     * Contains the currently active access token.
     */
    private accessToken: string|null = null;

    /**
     * Gets the access token either from cache or from the token endpoint.
     * @param retryCount The number of retries before reporting failure.
     */
    private async getAccessTokenAsync(retryCount?: number): Promise<string> {
        this.platform.logger.debug(`Getting access token...`);

        // Checks if the current access token is expired
        if (this.expirationDateTime && this.expirationDateTime.getTime() < new Date().getTime() - (120 * 1000)) {
            this.expirationDateTime = null;
            this.accessToken = null;
        }

        // Checks if a cached access token exists
        if (this.accessToken) {
            this.platform.logger.debug(`Access token cached.`);
            return this.accessToken;
        }

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumTokenRetry;
        }
        
        // Sends the HTTP request to get a new access token
        try {
            const response = await axios.post<TokenResponse>(this.platform.configuration.tokenUri, qs.stringify({
                grant_type: 'password',
                username:  this.platform.configuration.emailAddress,
                password: this.platform.configuration.password,
                scope: 'openid 02106b82-0524-4fd3-ac57-af774f340979',
                client_id: '02106b82-0524-4fd3-ac57-af774f340979',
                response_type: 'token id_token'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // Stores the access token
            this.accessToken = response.data.access_token;
            this.expirationDateTime = new Date(new Date().getTime() + (response.data.expires_in * 1000));

            // Returns the access token
            this.platform.logger.debug(`Access token received from server.`);
            return this.accessToken;
        } catch (e) {
            this.platform.logger.warn(`Error while retrieving access token: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.tokenRetryInterval));
                return await this.getAccessTokenAsync(retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Gets all locks from the API.
     * @param retryCount The number of retries before reporting failure.
     */
    public async getLocksAsync(retryCount?: number): Promise<Array<Lock>> {
        this.platform.logger.debug(`Getting locks from API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to get the locks
        try {
            const response = await axios.get<LocksResponse>(`${this.platform.configuration.apiUri}/my/lock`, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));
            this.platform.logger.debug(`Locks received from API.`);
            return response.data.result;
        } catch (e) {
            this.platform.logger.warn(`Error while getting locks from API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                return await this.getLocksAsync(retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Syncs the recent changes of all locks from the API.
     * @param retryCount The number of retries before reporting failure.
     */
    public async syncLocksAsync(retryCount?: number): Promise<Array<LockSync>> {
        this.platform.logger.debug(`Syncing locks from API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to sync the locks
        try {
            const response = await axios.get<LocksSyncResponse>(`${this.platform.configuration.apiUri}/my/lock/sync`, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));
            this.platform.logger.debug(`Locks synced from API.`);
            return response.data.result;
        } catch (e) {
            this.platform.logger.warn(`Error while syncing locks from API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                return await this.syncLocksAsync(retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Syncs the recent changes of a single lock from the API.
     * @param id The ID of the lock.
     * @param retryCount The number of retries before reporting failure.
     */
    public async syncLockAsync(id: number, retryCount?: number): Promise<LockSync> {
        this.platform.logger.debug(`Syncing lock with ID ${id} from API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to sync the locks
        try {
            const response = await axios.get<LockSyncResponse>(`${this.platform.configuration.apiUri}/my/lock/${id}/sync`, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));
            this.platform.logger.debug(`Lock with ID ${id} synced from API.`);
            return response.data.result;
        } catch (e) {
            this.platform.logger.warn(`Error while syncing lock with ID ${id} from API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                return await this.syncLockAsync(id, retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Closes the lock with the specified ID.
     * @param id The ID of the lock.
     * @param retryCount The number of retries before reporting failure.
     */
    public async closeAsync(id: number, retryCount?: number): Promise<void> {

        // Gets the corresponding lock
        const lock = this.platform.locks.find(l => l.id === id);
        if (!lock) {
            this.platform.logger.warn(`Lock with ID ${id} not found, cannot lock.`);
            return;
        }
        this.platform.logger.debug(`[${lock.name}] Closing via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to set the box status
        try {
            let response = await axios.post<OperationResponse>(`${this.platform.configuration.apiUri}/my/lock/close`, { deviceId: id }, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));

            // Waits for the operation to complete
            while (response.data.result.status !== OperationStatus.Completed) {
                await new Promise<void>(r => setTimeout(() => r(), 1000));

                response = await axios.get<OperationResponse>(`${this.platform.configuration.apiUri}/my/device/operation/${response.data.result.operationId}`, { 
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    } 
                });

                this.platform.logger.debug(JSON.stringify(response.data));
                this.platform.logger.info(`[${lock.name}] Waiting for close operation to be completed.`);
            }

            this.platform.logger.info(`[${lock.name}] Closed via API.`);
        } catch (e) {
            this.platform.logger.warn(`[${lock.name}] Error while closing via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.closeAsync(id, retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Opens the lock with the specified ID.
     * @param id The ID of the lock.
     * @param retryCount The number of retries before reporting failure.
     */
    public async openAsync(id: number, retryCount?: number): Promise<void> {

        // Gets the corresponding lock
        const lock = this.platform.locks.find(l => l.id === id);
        if (!lock) {
            this.platform.logger.warn(`Lock with ID ${id} not found, cannot lock.`);
            return;
        }
        this.platform.logger.debug(`[${lock.name}] Opening via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to set the box status
        try {
            let response = await axios.post<OperationResponse>(`${this.platform.configuration.apiUri}/my/lock/open`, { deviceId: id }, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));

            // Waits for the operation to complete
            while (response.data.result.status !== OperationStatus.Completed) {
                await new Promise<void>(r => setTimeout(() => r(), 1000));

                response = await axios.get<OperationResponse>(`${this.platform.configuration.apiUri}/my/device/operation/${response.data.result.operationId}`, { 
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    } 
                });

                this.platform.logger.debug(JSON.stringify(response.data));
                this.platform.logger.info(`[${lock.name}] Waiting for open operation to be completed.`);
            }

            this.platform.logger.info(`[${lock.name}] Opened via API.`);
        } catch (e) {
            this.platform.logger.warn(`[${lock.name}] Error while opening via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.openAsync(id, retryCount);
            } else {
                throw e;
            }
        }
    }

    /**
     * Pulls the spring on the lock with the specified ID.
     * @param id The ID of the lock.
     * @param retryCount The number of retries before reporting failure.
     */
    public async pullSpringAsync(id: number, retryCount?: number): Promise<void> {

        // Gets the corresponding lock
        const lock = this.platform.locks.find(l => l.id === id);
        if (!lock) {
            this.platform.logger.warn(`Lock with ID ${id} not found, cannot lock.`);
            return;
        }
        this.platform.logger.debug(`[${lock.name}] Pulling spring via API...`);

        // Set the default retry count
        if (!retryCount) {
            retryCount = this.platform.configuration.maximumApiRetry;
        }

        // Gets the access token
        const accessToken = await this.getAccessTokenAsync();

        // Sends the HTTP request to set the box status
        try {
            let response = await axios.post<OperationResponse>(`${this.platform.configuration.apiUri}/my/lock/pull-spring`, { deviceId: id }, { 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                } 
            });
            this.platform.logger.debug(JSON.stringify(response.data));

            // Waits for the operation to complete
            while (response.data.result.status !== OperationStatus.Completed) {
                await new Promise<void>(r => setTimeout(() => r(), 1000));

                response = await axios.get<OperationResponse>(`${this.platform.configuration.apiUri}/my/device/operation/${response.data.result.operationId}`, { 
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    } 
                });

                this.platform.logger.debug(JSON.stringify(response.data));
                this.platform.logger.info(`[${lock.name}] Waiting for pull spring operation to be completed.`);
            }

            this.platform.logger.info(`[${lock.name}] Pulled spring via API.`);
        } catch (e) {
            this.platform.logger.warn(`[${lock.name}] Error while pulling spring via API: ${e}`);

            // Decreased the retry count and tries again
            retryCount--;
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, this.platform.configuration.apiRetryInterval));
                await this.pullSpringAsync(id, retryCount);
            } else {
                throw e;
            }
        }
    }
}
