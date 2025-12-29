/**
 * A distributed unique id generator based on Twitter's Snowflake algorithm.
 * * This class generates 64-bit bigint ids that are guaranteed to be unique
 *   within a distributed system and ensures that ids are roughly time-sortable.
 * * The IDs are composed of a timestamp, an internal identifier (combining a
 *   worker ID and a process ID), and a per-millisecond incrementer.
 * 
 * @example
 * ```typescript
 * import { Snowflake } from '@timondev/snowflake';
 * const id = Snowflake.generate(); // 159958744000000000n
 * 
 * // Configure the worker and process ids if needed.
 * Snowflake.configure({ workerId: 1n, processId: 2n });
 * const configured_id = Snowflake.generate();
 * ```
 */
export class Snowflake {

    // Private constructor to prevent direct instantiation.
    private constructor() { }

    // Constant for representing the value zero in bigint format.
    private static readonly ZERO_BIGINT = BigInt(0);

    // Several constants for shifting between the components.
    private static readonly WORKER_SHIFT = BigInt(18);
    private static readonly PROCESS_SHIFT = BigInt(14);
    private static readonly TIME_SHIFT = BigInt(22);

    // Limiters for process, worker aswell as increment component.
    private static readonly LIMITER = BigInt(2 ** 4);
    private static readonly INCREMENT_LIMITER = BigInt(0x3FFF);

    /** The custom `epoch` time used as a base for all generated snowflakes. */
    private static epoch: number = 1420070400000;

    // Components for generating snowflakes.
    private static lastTime: number = 0;
    private static increment = Snowflake.ZERO_BIGINT;
    private static workerId = BigInt(process.env.NODE_UNIQUE_ID ?? 0) % Snowflake.LIMITER;
    private static processId = BigInt(process.pid) % Snowflake.LIMITER;

    // Precompute identifiers
    private static identifiers =
        (Snowflake.workerId << Snowflake.WORKER_SHIFT)
        + (Snowflake.processId << Snowflake.PROCESS_SHIFT);

    // Cached timestamp
    private static time: bigint = BigInt(Snowflake.lastTime);

    /**
     * Configures the static `workerId` and `processId` for snowflake generation
     * which are otherwise derived from `process.env.NODE_UNIQUE_ID` and `process.pid`.
     * 
     * If a value is not provided, the existing one is kept.
     *
     * @param options - An object containing the optional `workerId` and `processId`.
     * @param options.workerId - The new worker identifier.
     * @param options.processId - The new process identifier.
     */
    public static configure(options: { epoch?: number, workerId?: bigint, processId?: bigint }): void {
        const { epoch, workerId, processId } = options;

        // replace the changed values if needed.
        if (workerId) Snowflake.workerId = workerId % Snowflake.LIMITER;
        if (processId) Snowflake.processId = processId % Snowflake.LIMITER;

        // when epoch changes, reset `lastTime` to zero.
        if (epoch) {
            Snowflake.epoch = epoch;
            Snowflake.lastTime = 0;
        }

        // recompute the identifiers if values have changed.
        if (workerId || processId) {
            Snowflake.identifiers =
                (Snowflake.workerId << Snowflake.WORKER_SHIFT)
                + (Snowflake.processId << Snowflake.PROCESS_SHIFT);
        }
    }

    /**
     * Generates an unique snowflake identifier.
     *
     * ```markdown
     * snowflakes are 64-bit integers consisting of 3 components:
     *
     * timestamp | internal identifiers | increment |
     * --------- | -------------------- | --------- |
     * 42 bits   | 8 bits               | 14bits    |
     * unique    | used for clusters    | unique    |
     * ```
     * 
     * @external https://en.wikipedia.org/wiki/Snowflake_ID
     * @returns unique 64-bit snowflake identifier.
     * @throws {RangeError} if increment limit is exceeded for the current millisecond.
     */
    public static generate(): bigint {
        const time = Math.floor(performance.now() + performance.timeOrigin - Snowflake.epoch);

        if (time > Snowflake.lastTime) {
            Snowflake.increment = Snowflake.ZERO_BIGINT;
            Snowflake.lastTime = time;
            Snowflake.time = BigInt(time);
        } else if (time < Snowflake.lastTime) {
            throw new Error('Clock moved backwards. Refusing to generate id');
        }

        // Construct snowflake by combining the elements
        let snowflake = (Snowflake.time << Snowflake.TIME_SHIFT)
            | Snowflake.identifiers
            | Snowflake.increment;

        if (++Snowflake.increment > Snowflake.INCREMENT_LIMITER) {
            throw new RangeError('Snowflake is out of range');
        }

        return snowflake;
    }

    /**
     * Resets increment counter to zero.
     * This method is intended primarily for testing purposes.
     */
    public static resetIncrement() {
        Snowflake.increment = Snowflake.ZERO_BIGINT;
    }
}