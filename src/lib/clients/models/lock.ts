
import { LockProperties } from './lock-properties';
import { SoftwareVersion } from './software-version';

/**
 * Represents the HTTP API model for a single lock.
 */
export interface Lock {

    /**
     * Gets or sets the ID of the lock.
     */
    id: number;

    /**
     * Gets or sets the name of the lock.
     */
    name: string;

    /**
     * Gets or sets the serial number of the lock.
     */
    serialNumber: string;

    /**
     * Gets or sets the properties of the lock.
     */
    lockProperties: LockProperties;

    /**
     * Gets or sets the device revision.
     */
    deviceRevision: number;

    /**
     * Gets or sets the software versions of the device.
     */
    softwareVersions: Array<SoftwareVersion>;
}
