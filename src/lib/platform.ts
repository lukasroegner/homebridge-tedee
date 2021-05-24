
import { HomebridgePlatform } from 'homebridge-framework';
import { Configuration } from './configuration/configuration';
import { TedeeLockController } from './controllers/tedee-lock-controller';
import { TedeeApiClient } from './clients/tedee-api-client';
import { Lock } from './clients/models/lock';

/**
 * Represents the platform of the plugin.
 */
export class Platform extends HomebridgePlatform<Configuration> {

    /**
     * Contains the handle for the update timer.
     */
    private updateHandle: any = null;

    /**
     * Gets or sets the list of all locks.
     */
    public locks = new Array<Lock>();

    /**
     * Gets or sets the list of all controllers that represent physical lock devices in HomeKit.
     */
    public controllers = new Array<TedeeLockController>();

    /**
     * Gets the name of the plugin.
     */
    public get pluginName(): string {
        return 'homebridge-tedee';
    }    
    
    /**
     * Gets the name of the platform which is used in the configuration file.
     */
    public get platformName(): string {
        return 'TedeePlatform';
    }

    /**
     * Contains the client that is used to communicate via HTTP API.
     */
    private _apiClient: TedeeApiClient|null = null;

    /**
     * Gets the client that is used to communicate via HTTP API.
     */
    public get apiClient(): TedeeApiClient {
        if (!this._apiClient) {
            throw new Error('Platform not initialized yet.');
        }
        return this._apiClient;
    }

    /**
     * Updates the devices from the API.
     */
    public async updateAsync() {
        try {
            this.logger.debug('Syncing locks from the API...');

            // Gets sync information for all locks from the API
            const lockSyncs = await this.apiClient.syncLocksAsync();

            // Updates the locks
            for (let controller of this.controllers) {
                const lock = this.locks.find(l => l.name === controller.name);
                if (lock) {

                    // Gets the sync information for the lock (via ID)
                    const lockSync = lockSyncs.find(s => s.id == lock.id);
                    if (lockSync) {
                        controller.update(lockSync);
                    }
                }
            }

            this.logger.debug('Locks synced from the API.');
        } catch (e) {
            this.logger.warn('Failed to sync locks from API.');
        }
    }

    /**
     * Is called when the platform is initialized.
     */
    public async initialize(): Promise<void> {
        this.logger.info(`Initializing platform...`);

        // Initializes the configuration
        this.configuration.tokenUri = 'https://tedee.b2clogin.com/tedee.onmicrosoft.com/oauth2/v2.0/token?p=B2C_1_SignIn_Ropc';
        this.configuration.maximumTokenRetry = 3;
        this.configuration.tokenRetryInterval = 2000;
        this.configuration.apiUri = 'https://api.tedee.com/api/v1.18';
        this.configuration.maximumApiRetry = 3;
        this.configuration.apiRetryInterval = 5000;
        this.configuration.updateInterval = this.configuration.updateInterval || 15;

        // As per documentation, the update interval should not be below 10 seconds
        if (this.configuration.updateInterval < 10) {
            this.configuration.updateInterval = 10;
        }

        // Initializes the client
        this._apiClient = new TedeeApiClient(this);

        // Gets the locks from the API
        this.locks = await this.apiClient.getLocksAsync();

        // Cycles over all configured devices and creates the corresponding controllers
        if (this.configuration.devices) {
            for (let deviceConfiguration of this.configuration.devices) {
                if (deviceConfiguration.name) {

                    // Gets the corresponding lock
                    const lock = this.locks.find(l => l.name === deviceConfiguration.name);
                    if (lock) {

                        // Creates the new controller for the device and stores it
                        const tedeeLockController = new TedeeLockController(this, deviceConfiguration, lock);
                        this.controllers.push(tedeeLockController);
                    } else {
                        this.logger.warn(`No device with name '${deviceConfiguration.name}' found in your account.`);
                    }
                } else {
                    this.logger.warn(`Device name missing in the configuration.`);
                }
            }
        } else {
            this.logger.warn(`No devices configured.`);
        }

        // Initializes the background updates
        this.updateHandle = setInterval(() => this.updateAsync(), this.configuration.updateInterval * 1000);
    }

    /**
     * Is called when homebridge is shut down.
     */
    public destroy() {
        this.logger.info(`Shutting down timers...`);
        if (this.updateHandle) {
            clearInterval(this.updateHandle);
            this.updateHandle = null;
        }
    }
}
