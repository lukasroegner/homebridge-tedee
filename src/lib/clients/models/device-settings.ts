
/**
 * Represents the HTTP API model for device settings.
 */
export interface DeviceSettings {

    /**
     * Gets or sets a value that determines whether the pull spring is enabled for this lock.
     */
    pullSpringEnabled: boolean;

    /**
     * Gets or sets a value that determines whether the automatic pull spring is enabled when unlocking.
     */
    autoPullSpringEnabled: boolean;
}
