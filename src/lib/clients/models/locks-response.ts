
import { Lock } from './lock';

/**
 * Represents the HTTP API model for a response with an array of locks.
 */
export interface LocksResponse {

    /**
     * Gets or sets the requested locks.
     */
    result: Array<Lock>;
}
