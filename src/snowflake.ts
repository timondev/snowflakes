/**
 * Distributed unique ID generator based on Twitter's Snowflake.
 * 
 * Generates unique, time-sortable 64-bit `bigint` IDs.
 * IDs combine a timestamp, worker/process identifiers, and a sequence increment.
 * 
 * @example
 * ```typescript
 * import { Snowflake } from '@timondev/snowflake';
 * const id = Snowflake.generate(); // 159958744000000000n
 * 
 * // Configure worker and process ids.
 * Snowflake.configure({ workerId: 1n, processId: 2n });
 * const configured_id = Snowflake.generate();
 * ```
 */
export class Snowflake {

    // Prevent instantiation.
    private constructor() { }

    // Bitwise shift constants.
    private static readonly WORKER_SHIFT = 18;
    private static readonly PROCESS_SHIFT = 14;
    private static readonly TIME_SHIFT = 22n;

    // Component limits.
    private static readonly LIMITER = 16;
    private static readonly INCREMENT_LIMITER = 0x3FFF;

    // Custom epoch timestamp.
    private static epoch: number = 1420070400000;

    // Generator state.
    private static lastTime: number = 0;
    private static increment: number = 0;
    private static workerId: number = Math.abs(Number(process.env.NODE_UNIQUE_ID ?? 0) || 0) % Snowflake.LIMITER;
    private static processId: number = Math.abs(process.pid) % Number(Snowflake.LIMITER);

    // Precomputed identifiers.
    private static identifiers: bigint =
        BigInt((Snowflake.workerId << Snowflake.WORKER_SHIFT)
            + (Snowflake.processId << Snowflake.PROCESS_SHIFT));

    // Cache increment BigInts to avoid allocation.
    private static readonly INCREMENT_CACHE: bigint[] = Array.from(
        { length: Snowflake.INCREMENT_LIMITER + 1 },
        (_, i) => BigInt(i)
    );

    // Cached timestamp and identifiers.
    private static shiftedTimeWithIdentifiers: bigint =
        (BigInt(Snowflake.lastTime) << Snowflake.TIME_SHIFT) | Snowflake.identifiers;

    /**
     * Configures `workerId` and `processId`. Defaults to `process.env.NODE_UNIQUE_ID` and `process.pid`.
     * 
     * Preserves existing values if unspecified.
     *
     * @param options - Configuration options.
     * @param options.workerId - Worker identifier.
     * @param options.processId - Process identifier.
     */
    public static configure(options: { epoch?: number, workerId?: number, processId?: number }): void {
        const { epoch, workerId, processId } = options;

        // Update values if provided.
        if (workerId !== undefined) Snowflake.workerId = Math.abs(workerId) % Snowflake.LIMITER;
        if (processId !== undefined) Snowflake.processId = Math.abs(processId) % Snowflake.LIMITER;

        // Reset `lastTime` on epoch change.
        if (epoch !== undefined) {
            Snowflake.epoch = epoch;
            Snowflake.lastTime = 0;
        }

        // Recompute identifiers.
        if (workerId !== undefined || processId !== undefined) {
            Snowflake.identifiers = BigInt(
                (Snowflake.workerId << Snowflake.WORKER_SHIFT)
                + (Snowflake.processId << Snowflake.PROCESS_SHIFT)
            );
        }

        // Recompute cached timestamp/identifiers.
        if (epoch !== undefined || workerId !== undefined || processId !== undefined) {
            Snowflake.shiftedTimeWithIdentifiers =
                (BigInt(Snowflake.lastTime) << Snowflake.TIME_SHIFT) | Snowflake.identifiers;
        }
    }

    /**
     * Generates a unique 64-bit ID.
     *
     * ```markdown
     * IDs are 64-bit integers with 3 components:
     *
     * timestamp | internal identifiers | increment |
     * --------- | -------------------- | --------- |
     * 42 bits   | 8 bits               | 14bits    |
     * unique    | used for clusters    | unique    |
     * ```
     * 
     * @external https://en.wikipedia.org/wiki/Snowflake_ID
     * @returns Unique 64-bit ID.
     * @throws {RangeError} If increment limit is exceeded for the current millisecond.
     */
    public static generate(): bigint {
        const time = Date.now() - Snowflake.epoch;

        if (time > Snowflake.lastTime) {
            Snowflake.increment = 0;
            Snowflake.lastTime = time;
            Snowflake.shiftedTimeWithIdentifiers = (BigInt(time) << Snowflake.TIME_SHIFT) | Snowflake.identifiers;
        } else if (time < Snowflake.lastTime) {
            throw new Error('Clock moved backwards. Refusing to generate id');
        }

        if (Snowflake.increment > Snowflake.INCREMENT_LIMITER) {
            throw new RangeError('Snowflake is out of range');
        }

        // Combine components.
        let snowflake = Snowflake.shiftedTimeWithIdentifiers | Snowflake.INCREMENT_CACHE[Snowflake.increment]!;
        Snowflake.increment++;

        return snowflake;
    }

    /**
     * Resets increment. For testing only.
     */
    public static resetIncrement() {
        Snowflake.increment = 0;
    }
}