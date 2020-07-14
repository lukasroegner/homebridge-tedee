
import { Platform } from '../platform';
import { DeviceConfiguration } from '../configuration/device-configuration';
import { Homebridge, Characteristic } from 'homebridge-framework';
import { Lock } from '../clients/models/lock';

/**
 * Represents a controller for a Tedee lock device. Controllers represent physical devices in HomeKit.
 */
export class TedeeLockController {

    /**
     * Initializes a new TedeeLockController instance.
     * @param platform The plugin platform.
     * @param deviceConfiguration The configuration of the Tedee lock device that is represented by this controller.
     * @param lock The lock inforation received from the API.
     */
    constructor(private platform: Platform, private deviceConfiguration: DeviceConfiguration, lock: Lock) {
        platform.logger.info(`[${deviceConfiguration.name}] Initializing...`);

        // Sets the ID and name
        this.lock = lock;
        this.id = this.lock.id;
        this.name = deviceConfiguration.name;

        // Gets the version
        const softwareVersion = this.lock.softwareVersions.find(s => s.softwareType === 0);

        // Creates the accessory
        const lockAccessory = platform.useAccessory(deviceConfiguration.name, deviceConfiguration.name, 'lock');
        lockAccessory.setInformation({
            manufacturer: 'tedee',
            model: 'Smart Lock',
            serialNumber: this.lock.serialNumber,
            firmwareRevision: !softwareVersion ? null : softwareVersion.version,
            hardwareRevision: this.lock.deviceRevision.toString()
        });

        // Creates the lock service for the device
        platform.logger.info(`[${deviceConfiguration.name}] Adding lock service`);
        let lockService = lockAccessory.useService(Homebridge.Services.LockMechanism, deviceConfiguration.defaultLockName || 'Lock', 'lock');

        // Adds the characteristics for the lock service
        this.lockCurrentStateCharacteristic = lockService.useCharacteristic<number>(Homebridge.Characteristics.LockCurrentState);
        this.lockTargetStateCharacteristic = lockService.useCharacteristic<number>(Homebridge.Characteristics.LockTargetState);
        this.lockTargetStateCharacteristic.valueChanged = async newValue => {

            // Checks if the operation is unsecured or secured
            if (newValue === Homebridge.Characteristics.LockTargetState.UNSECURED) {
                if (this.lockCurrentStateCharacteristic.value === Homebridge.Characteristics.LockCurrentState.SECURED) {
                    
                    // Checks if unlocking is enabled
                    if (this.deviceConfiguration.disableUnlock) {
                        setTimeout(() => {
                            this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.SECURED;
                        }, 500);
                        return;
                    }

                    // Starts the operation
                    this.isOperating = true;
                    
                    // Sets the target state of the unlatch switch to unsecured, as both should be displayed as open
                    if (this.lock.deviceSettings && this.lock.deviceSettings.pullSpringEnabled && this.lock.deviceSettings.autoPullSpringEnabled && this.latchTargetStateCharacteristic) {
                        this.latchTargetStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                    }

                    // Sends the open command to the API
                    platform.logger.info(`[${deviceConfiguration.name}] Open via HomeKit requested.`);
                    try {
                        await platform.apiClient.openAsync(this.lock.id);
                    } catch (e) {
                        platform.logger.warn(`[${deviceConfiguration.name}] Failed to open via HomeKit`);
                    }
                } else {
                    if (deviceConfiguration.unlatchFromUnlockedToUnlocked && this.lock.deviceSettings && this.lock.deviceSettings.pullSpringEnabled) {

                        // Checks if unlocking is enabled
                        if (this.deviceConfiguration.disableUnlock) {
                            return;
                        }
                        
                        // Starts the operation
                        this.isOperating = true;
                        
                        // Sets the target state of the unlatch switch to unsecured, as both should be displayed as open
                        if (this.latchTargetStateCharacteristic) {
                            this.latchTargetStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                        }

                        // Checks if the door is half-closed, in this case, an open command has to be used instead of the pull spring command
                        if (this.lock.lockProperties.state === 3) {

                            // Sends the open command to the API
                            platform.logger.info(`[${deviceConfiguration.name}] Open via HomeKit requested.`);
                            try {
                                await platform.apiClient.openAsync(this.lock.id);
                            } catch (e) {
                                platform.logger.warn(`[${deviceConfiguration.name}] Failed to open via HomeKit`);
                            }
                        } else {

                            // Sends the pull spring command to the API
                            platform.logger.info(`[${deviceConfiguration.name}] Pull spring via HomeKit requested.`);
                            try {
                                await platform.apiClient.pullSpringAsync(this.lock.id);
                            } catch (e) {
                                platform.logger.warn(`[${deviceConfiguration.name}] Pull spring via HomeKit`);
                            }
                        }
                    }
                }
            } else {
                    
                // Starts the operation
                this.isOperating = true;
                
                // Sends the close command to the API
                platform.logger.info(`[${deviceConfiguration.name}] Close via HomeKit requested.`);
                try {
                    await platform.apiClient.closeAsync(this.lock.id);
                } catch (e) {
                    platform.logger.warn(`[${deviceConfiguration.name}] Failed to close via HomeKit`);
                }
            }

            // Stops the operation, requests updates for the next seconds
            setTimeout(() => {
                this.isOperating = false;
                platform.updateAsync();
            }, 5 * 1000);
            setTimeout(() => platform.updateAsync(), 10 * 1000);
            setTimeout(() => platform.updateAsync(), 15 * 1000);
        };

        // Checks if the latch service should be exposed
        if (deviceConfiguration.unlatchLock) {

            // Creates the latch service for the device
            platform.logger.info(`[${deviceConfiguration.name}] Adding latch service`);
            let latchService = lockAccessory.useService(Homebridge.Services.LockMechanism, deviceConfiguration.defaultLatchName || 'Latch', 'latch');
    
            // Adds the characteristics for the lock service
            this.latchCurrentStateCharacteristic = latchService.useCharacteristic<number>(Homebridge.Characteristics.LockCurrentState);
            this.latchTargetStateCharacteristic = latchService.useCharacteristic<number>(Homebridge.Characteristics.LockTargetState);
            this.latchTargetStateCharacteristic.valueChanged = async newValue => {

                // Checks if the pull spring is enabled
                if (!this.lock.deviceSettings || !this.lock.deviceSettings.pullSpringEnabled) {
                    setTimeout(() => {
                        this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                        this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    }, 500);
                    return;
                }
                
                // Checks if the operation is unsecured, as the latch cannot be secured
                if (newValue !== Homebridge.Characteristics.LockTargetState.UNSECURED) {
                    return;
                }

                // Checks if unlocking is enabled
                if (this.deviceConfiguration.disableUnlock) {
                    setTimeout(() => {
                        this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                        this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    }, 500);
                    return;
                }

                // As the lock is locked, the spring cannot be pulled
                if (this.lockCurrentStateCharacteristic.value === Homebridge.Characteristics.LockCurrentState.SECURED) {
                    setTimeout(() => {
                        this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                        this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    }, 500);
                    return;
                }

                // Starts the operation
                this.isOperating = true;

                // Sets the target state of the lock to unsecured, as both should be displayed as open
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;

                // Checks if the door is half-closed, in this case, an open command has to be used instead of the pull spring command
                if (this.lock.lockProperties.state === 3) {

                    // Sends the open command to the API
                    platform.logger.info(`[${deviceConfiguration.name}] Open via HomeKit requested.`);
                    try {
                        await platform.apiClient.openAsync(this.lock.id);
                    } catch (e) {
                        platform.logger.warn(`[${deviceConfiguration.name}] Failed to open via HomeKit`);
                    }
                } else {

                    // Sends the pull spring command to the API
                    platform.logger.info(`[${deviceConfiguration.name}] Pull spring via HomeKit requested.`);
                    try {
                        await platform.apiClient.pullSpringAsync(this.lock.id);
                    } catch (e) {
                        platform.logger.warn(`[${deviceConfiguration.name}] Pull spring via HomeKit`);
                    }
                }

                // Stops the operation, requests updates for the next seconds
                setTimeout(() => {
                    this.isOperating = false;
                    platform.updateAsync();
                }, 5 * 1000);
                setTimeout(() => platform.updateAsync(), 10 * 1000);
                setTimeout(() => platform.updateAsync(), 15 * 1000);
            };
        }

        // Creates the battery service
        platform.logger.info(`[${deviceConfiguration.name}] Adding battery service`);
        let batteryService = lockAccessory.useService(Homebridge.Services.BatteryService, 'Battery', 'battery');
        this.statusLowBatteryCharacteristic = batteryService.useCharacteristic<number>(Homebridge.Characteristics.StatusLowBattery);
        this.chargingStateCharacteristic = batteryService.useCharacteristic<number>(Homebridge.Characteristics.ChargingState);
        this.batteryLevelCharacteristic = batteryService.useCharacteristic<number>(Homebridge.Characteristics.BatteryLevel);

        // Updates the lock
        this.update(lock);
    }

    /**
     * Gets or sets the lock information.
     */
    private lock: Lock;

    /**
     * Contains a value that determines whether the lock is currently operating.
     */
    private isOperating: boolean = false;

    /**
     * Contains the current state characteristic of the lock.
     */
    private lockCurrentStateCharacteristic: Characteristic<number>;

    /**
     * Contains the target state characteristic of the lock.
     */
    private lockTargetStateCharacteristic: Characteristic<number>;

    /**
     * Contains the current state characteristic of the latch.
     */
    private latchCurrentStateCharacteristic: Characteristic<number>|null = null;

    /**
     * Contains the target state characteristic of the latch.
     */
    private latchTargetStateCharacteristic: Characteristic<number>|null = null;

    /**
     * Contains the low battery characteristic of the lock.
     */
    private statusLowBatteryCharacteristic: Characteristic<number>;

    /**
     * Contains the charging state characteristic of the lock.
     */
    private chargingStateCharacteristic: Characteristic<number>;

    /**
     * Contains the battery level characteristic of the lock.
     */
    private batteryLevelCharacteristic: Characteristic<number>;

    /**
     * Gets or sets the ID of the lock.
     */
    public id: number;

    /**
     * Gets or sets the name of the lock.
     */
    public name: string;

    /**
     * Updates the state of the lock.
     * @param lock The lock data.
     */
    public update(lock: Lock) {
        this.platform.logger.debug(`[${this.name}] Update received.`);
        this.lock = lock;

        // If the lock is operating, nothing should be updated
        if (this.isOperating) {
            return;
        }

        // Checks if the lock properties can be read
        if (!this.lock.lockProperties) { 
            this.platform.logger.debug(`[${this.name}] Lock properties not available, no update possible.`);
            return;
        }

        // Sets the current and target state
        switch (this.lock.lockProperties.state) {
            case 0:
            case 1:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.JAMMED;
                break;

            // Open
            case 2:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;

            // Half-closed
            case 3:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;

            // Opening
            case 4:
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;

            // Closing
            case 5:
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.SECURED;
                break;

            // Closed
            case 6:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.SECURED;
                break;
            
            // Unlatched
            case 7:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;

            // Unlatching
            case 8:
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;
        }

        // Checks if the unlatch lock is enabled
        if (this.deviceConfiguration.unlatchLock) {

            // Sets the current and target state
            switch (this.lock.lockProperties.state) {
                case 0:
                case 1:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.JAMMED;
                    break;

                // Open
                case 2:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;

                // Half-closed
                case 3:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;

                // Opening
                case 4:
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;

                // Closing
                case 5:
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;

                // Closed
                case 6:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;
                
                // Unlatched
                case 7:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                    break;

                // Unlatching
                case 8:
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                    break;
            }
        }

        // Updates the battery state
        this.batteryLevelCharacteristic.value = this.lock.lockProperties.batteryLevel;
        this.statusLowBatteryCharacteristic.value = this.lock.lockProperties.batteryLevel >= 10 ? Homebridge.Characteristics.StatusLowBattery.BATTERY_LEVEL_NORMAL : Homebridge.Characteristics.StatusLowBattery.BATTERY_LEVEL_LOW;
        this.chargingStateCharacteristic.value = this.lock.lockProperties.isCharging ? Homebridge.Characteristics.ChargingState.CHARGING : Homebridge.Characteristics.ChargingState.NOT_CHARGING;
    }
}
