
import { LockProperties } from './lock-properties';

/**
 * Represents the HTTP API model for sync information of a single lock.
 */
export interface LockSync {

    /**
     * Gets or sets the ID of the lock.
     */
    id: number;

    /**
     * Gets or sets the updated properties of the lock.
     */
    lockProperties: LockProperties;
}
