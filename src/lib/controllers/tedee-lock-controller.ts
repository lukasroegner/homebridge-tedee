
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
    constructor(platform: Platform, private deviceConfiguration: DeviceConfiguration, lock: Lock) {
        platform.logger.info(`[${deviceConfiguration.name}] Initializing...`);

        // Sets the ID and name
        this.id = lock.id;
        this.name = deviceConfiguration.name;

        // Gets the version
        const softwareVersion = lock.softwareVersions.find(s => s.softwareType === 0);

        // Creates the accessory
        const lockAccessory = platform.useAccessory(deviceConfiguration.name, deviceConfiguration.name, 'lock');
        lockAccessory.setInformation({
            manufacturer: 'tedee',
            model: 'Smart Lock',
            serialNumber: lock.serialNumber,
            firmwareRevision: !softwareVersion ? null : softwareVersion.version,
            hardwareRevision: lock.deviceRevision.toString()
        });

        // Creates the lock service for the device
        platform.logger.info(`[${deviceConfiguration.name}] Adding lock service`);
        let lockService = lockAccessory.useService(Homebridge.Services.LockMechanism, deviceConfiguration.defaultLockName || 'Lock', 'lock');

        // Adds the characteristics for the lock service
        this.lockCurrentStateCharacteristic = lockService.useCharacteristic<number>(Homebridge.Characteristics.LockCurrentState);
        this.lockTargetStateCharacteristic = lockService.useCharacteristic<number>(Homebridge.Characteristics.LockTargetState);
        this.lockTargetStateCharacteristic.valueChanged = async newValue => {
            
            // Starts the operation
            this.isOperating = true;

            // Checks if the operation is unsecured or secured
            if (newValue === Homebridge.Characteristics.LockTargetState.UNSECURED) {
                if (this.lockCurrentStateCharacteristic.value === Homebridge.Characteristics.LockCurrentState.SECURED) {
                    if (deviceConfiguration.unlatchFromLockedToUnlocked) {

                        // Sets the target state of the unlatch switch to unsecured, as both should be displayed as open
                        if (this.latchTargetStateCharacteristic) {
                            this.latchTargetStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                        }

                        // Sends the pull spring command to the API
                        platform.logger.info(`[${deviceConfiguration.name}] Unlatch (from lock) via HomeKit requested.`);
                        try {
                            await platform.apiClient.pullSpringAsync(lock.id);
                        } catch (e) {
                            platform.logger.warn(`[${deviceConfiguration.name}] Failed to unlatch (from lock) via HomeKit`);
                        }
                    } else {

                        // Sends the open command to the API
                        platform.logger.info(`[${deviceConfiguration.name}] Unlock via HomeKit requested.`);
                        try {
                            await platform.apiClient.pullSpringAsync(lock.id);
                        } catch (e) {
                            platform.logger.warn(`[${deviceConfiguration.name}] Failed to unlock via HomeKit`);
                        }
                    }
                } else {
                    if (deviceConfiguration.unlatchFromUnlockedToUnlocked) {

                        // Sets the target state of the unlatch switch to unsecured, as both should be displayed as open
                        if (this.latchTargetStateCharacteristic) {
                            this.latchTargetStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                        }

                        // Sends the pull spring command to the API
                        platform.logger.info(`[${deviceConfiguration.name}] Unlatch (from lock) via HomeKit requested.`);
                        try {
                            await platform.apiClient.pullSpringAsync(lock.id);
                        } catch (e) {
                            platform.logger.warn(`[${deviceConfiguration.name}] Failed to unlatch (from lock) via HomeKit`);
                        }
                    }
                }
            } else {
                
                // Sends the close command to the API
                platform.logger.info(`[${deviceConfiguration.name}] Lock via HomeKit requested.`);
                try {
                    await platform.apiClient.closeAsync(lock.id);
                } catch (e) {
                    platform.logger.warn(`[${deviceConfiguration.name}] Failed to lock via HomeKit`);
                }
            }

            // Stops the operation, requests updates now and in 10 seconds
            this.isOperating = false;
            platform.updateAsync();
            setTimeout(() => platform.updateAsync(), 10 * 1000);
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

                // Checks if the operation is unsecured, as the latch cannot be secured
                if (newValue !== Homebridge.Characteristics.LockTargetState.UNSECURED) {
                    return;
                }

                // Checks if the safety mechanism is enabled, so that the lock cannot unlatch when locked
                if (this.lockCurrentStateCharacteristic.value === Homebridge.Characteristics.LockCurrentState.SECURED) {
                    if (deviceConfiguration.unlatchLockPreventUnlatchIfLocked) {
                        this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                        this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                        return;
                    }
                }

                // Sets the target state of the lock to unsecured, as both should be displayed as open
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;

                // Sends the pull spring command to the API
                platform.logger.info(`[${deviceConfiguration.name}] Unlatch (from latch) via HomeKit requested.`);
                try {
                    await platform.apiClient.pullSpringAsync(lock.id);
                } catch (e) {
                    platform.logger.warn(`[${deviceConfiguration.name}] Failed to unlatch (from latch) via HomeKit`);
                }
            };
        }

        // Updates the lock
        this.update(lock);
    }

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

        // If the lock is operating, nothing should be updated
        if (this.isOperating) {
            return;
        }

        // Sets the current and target state
        switch (lock.lockProperties.state) {
            case 0:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.JAMMED;
                break;
            
            case 1:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.SECURED;
                break;
            
            case 2:
            case 3:
                this.lockCurrentStateCharacteristic.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                this.lockTargetStateCharacteristic.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                break;
        }

        // Checks if the unlatch lock is enabled
        if (this.deviceConfiguration.unlatchLock) {

            // Sets the current and target state
            switch (lock.lockProperties.state) {
                case 0:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.JAMMED;
                    break;

                case 1:
                case 2:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.SECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.SECURED;
                    break;
                
                case 3:
                    this.latchCurrentStateCharacteristic!.value = Homebridge.Characteristics.LockCurrentState.UNSECURED;
                    this.latchTargetStateCharacteristic!.value = Homebridge.Characteristics.LockTargetState.UNSECURED;
                    break;
            }
        }
    }
}
