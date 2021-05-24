
import { LockSync } from './lock-sync';

/**
 * Represents the HTTP API model for a response with a lock update (i.e. sync).
 */
export interface LockSyncResponse {

    /**
     * Gets or sets the requested sync information for a single lock.
     */
    result: LockSync;
}
