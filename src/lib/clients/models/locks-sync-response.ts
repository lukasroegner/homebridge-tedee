
import { LockSync } from './lock-sync';

/**
 * Represents the HTTP API model for a response with an array of lock updates (i.e. syncs).
 */
export interface LocksSyncResponse {

    /**
     * Gets or sets the requested sync information for all locks.
     */
    result: Array<LockSync>;
}
