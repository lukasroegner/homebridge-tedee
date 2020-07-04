
/**
 * Represents the HTTP API model for lock properties.
 */
export interface LockProperties {

    /**
     * Gets or sets the state of the lock.
     */
    state: number;

    /**
     * Gets or sets a value that determines whether the lock is charging.
     */
    isCharging: number;

    /**
     * Gets or sets the batter level in percent.
     */
    batteryLevel: number;
}
