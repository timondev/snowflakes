import { test, expect, describe, spyOn, mock, beforeEach, afterEach } from 'bun:test';
import { Snowflake } from '$src/snowflake';

let mocked_timestamp: number = 42.0;
let mocked_epoch: number = 1420070400000;

beforeEach(() => {
    // Reset mocked time.
    mocked_timestamp = 42.0;

    // Mock `Date.now()` for predictability.
    spyOn(Date, 'now').mockImplementation(() => Math.floor(mocked_epoch + mocked_timestamp));

    // Configure epoch and reset increment.
    Snowflake.configure({ epoch: mocked_epoch, workerId: 4, processId: 8 });
    Snowflake.resetIncrement();
});

afterEach(() => {
    // Restore original functionality.
    mock.restore();
});

describe('Snowflake', () => {
    test('prevent direct instantiation', () => {
        expect(Snowflake.prototype.constructor).toThrowError(TypeError);
    });

    test('generate a unique bigint id', () => {
        const id = Snowflake.generate();

        // Expect `bigint` type.
        expect(typeof id).toBe('bigint');

        // Expect not null.
        expect(id).not.toBeNull();
    });

    test('generate sequential ids which differ in increment', () => {
        const ids = [Snowflake.generate(), Snowflake.generate()];

        // Expect increment of 1.
        expect(ids[1]! & 0x3FFFn).toBe(1n);

        // Reset increment, generate ID.
        Snowflake.resetIncrement();
        const id = Snowflake.generate();

        // Expect increment of 0.
        expect(id & 0x3FFFn).toBe(0n);
    });

    test('generate sequential ids with similar timestamp', () => {
        const ids = [Snowflake.generate(), Snowflake.generate()];

        // Calculate timestamp difference.
        let timestamp_difference = Number((ids[1]! >> 22n) - (ids[0]! >> 22n));

        // Expect similar timestamps.
        expect(timestamp_difference).toEqual(0);
    });

    test('not generate overlapping ids', () => {
        const ids: Set<bigint> = new Set();

        // Generate max IDs per ms.
        for (let index = 0; index < 0x4000; index++) {
            ids.add(Snowflake.generate());
        }

        // Expect unique IDs.
        expect(ids.size).toBe(0x4000);

        // Expect `RangeError` on overflow.
        expect(Snowflake.generate).toThrowError(RangeError);
    });

    test('throw an error if the clock moves backward', () => {
        Snowflake.generate(); // Initialize `lastTime`.

        // Move clock backward.
        mocked_timestamp -= 10;

        // Expect error.
        expect(() => Snowflake.generate()).toThrow('Clock moved backwards. Refusing to generate id');
    });

    describe('components', () => {
        test('handle predictable timestamps if supplied', () => {
            // Expect timestamp match.
            expect(Snowflake.generate() >> 22n).toBe(42n);

            mocked_epoch = 1420042000000;
            Snowflake.configure({ epoch: mocked_epoch });

            // Expect updated timestamp match.
            expect(Snowflake.generate() >> 22n).toBe(42n);
        });

        test('handle and reset increments when time changes', () => {
            const ids = [Snowflake.generate()];

            // Increase mocked time.
            mocked_timestamp += 1;

            // Generate ID with new timestamp.
            ids.push(Snowflake.generate());

            // Expect both increments to be 0.
            expect(ids[0]! & 0x3FFFn).toBe(0n);
            expect(ids[1]! & 0x3FFFn).toBe(0n);
        });

        test('handle worker and process identifiers if supplied', () => {
            const mocked_workerid = 3;
            const mocked_processid = 6;

            Snowflake.configure({ workerId: mocked_workerid, processId: mocked_processid });

            // Calculate expected identifiers.
            const expected_identifiers = (mocked_workerid << 4) | mocked_processid;

            // Expect match.
            expect(Number((Snowflake.generate() & 0x3ff000n) >> 14n)).toBe(expected_identifiers);
        });

        test('wrap workerId and processId if they exceed the 4-bit limit', () => {
            Snowflake.configure({ workerId: 17, processId: 19 });
            const id = Snowflake.generate();
            const workerId = Number((id & 0x3C0000n) >> 18n);
            const processId = Number((id & 0x3C000n) >> 14n);

            // Expect wrap around 16.
            expect(workerId).toBe(1);
            expect(processId).toBe(3);
        });

        test('handle negative workerId and processId', () => {
            Snowflake.configure({ workerId: -1, processId: -5 });
            const id = Snowflake.generate();
            const workerId = Number((id & 0x3C0000n) >> 18n);
            const processId = Number((id & 0x3C000n) >> 14n);

            // Expect absolute value modulo 16.
            // |-1| % 16 = 1
            // |-5| % 16 = 5
            expect(workerId).toBe(1);
            expect(processId).toBe(5);
        });
    });

    describe('configuration', () => {
        test('partial updates preserve other values', () => {
            Snowflake.configure({ workerId: 5 });
            let id = Snowflake.generate();
            let workerId = Number((id & 0x3C0000n) >> 18n);
            let processId = Number((id & 0x3C000n) >> 14n);

            // Expect updated workerId and preserved processId.
            expect(workerId).toBe(5);
            expect(processId).toBe(8);

            Snowflake.configure({ processId: 10 });
            id = Snowflake.generate();
            workerId = Number((id & 0x3C0000n) >> 18n);
            processId = Number((id & 0x3C000n) >> 14n);

            // Expect preserved workerId and updated processId.
            expect(workerId).toBe(5);
            expect(processId).toBe(10);
        });

        test('with undefined values preserves existing', () => {
            Snowflake.configure({ workerId: 5, processId: 10 });

            // Pass undefined explicitly
            Snowflake.configure({ workerId: undefined, processId: undefined });

            let id = Snowflake.generate();
            let workerId = Number((id & 0x3C0000n) >> 18n);
            let processId = Number((id & 0x3C000n) >> 14n);

            // Expect preserved values.
            expect(workerId).toBe(5);
            expect(processId).toBe(10);
        });

        test('with NaN defaults to 0', () => {
            Snowflake.configure({ workerId: NaN, processId: NaN });

            let id = Snowflake.generate();
            let workerId = Number((id & 0x3C0000n) >> 18n);
            let processId = Number((id & 0x3C000n) >> 14n);

            // Expect defaults to 0.
            expect(workerId).toBe(0);
            expect(processId).toBe(0);
        });

        test('future epoch throws Clock moved backwards error', () => {
            const futureEpoch = mocked_epoch + 2000;
            Snowflake.configure({ epoch: futureEpoch });

            // Expect error when generating ID.
            expect(() => Snowflake.generate()).toThrow('Clock moved backwards. Refusing to generate id');
        });
    });
});