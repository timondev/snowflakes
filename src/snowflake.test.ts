import { test, expect, describe, spyOn, mock, beforeEach, afterEach } from 'bun:test';
import { Snowflake } from '$src/snowflake';

let mocked_timestamp: number = 42.0;
let mocked_epoch: number = 1420070400000;

beforeEach(() => {
    // reset mocked time.
    mocked_timestamp = 42.0;

    // mock performance's `now()` and `timeOrigin` to ensure tests stay predictable.
    spyOn(performance, 'now').mockImplementation(() => mocked_timestamp); // @ts-ignore
    spyOn(performance, 'timeOrigin', 'get').mockImplementation(() => mocked_epoch);

    // explicitly configure the epoch and reset the increment for a clean state.
    Snowflake.configure({ epoch: mocked_epoch, workerId: 4n, processId: 8n });
    Snowflake.resetIncrement();
});

afterEach(() => {
    // restore the original performance.now() functionality.
    mock.restore();
});

describe('Snowflake', () => {
    test('prevent direct instantiation', () => {
        expect(Snowflake.prototype.constructor).toThrowError(TypeError);
    });

    test('generate a unique bigint id', () => {
        const id = Snowflake.generate();

        // expects snowflake to be of type bigint
        expect(typeof id).toBe('bigint');

        // expects snowflake not to be null.
        expect(id).not.toBeNull();
    });

    test('generate sequential ids which differ in increment', () => {
        const ids = [Snowflake.generate(), Snowflake.generate()];

        // expects second snowflake to have an increment of one.
        expect(ids[1]! & 0x3FFFn).toBe(1n);

        // reset the increment and create another id.
        Snowflake.resetIncrement();
        const id = Snowflake.generate();

        // expects snowflake after reset to have an increment of zero.
        expect(id & 0x3FFFn).toBe(0n);
    });

    test('generate sequential ids with similar timestamp', () => {
        const ids = [Snowflake.generate(), Snowflake.generate()];

        // calculate the difference between the two timestamps for the generated ids.
        let timestamp_difference = Number((ids[1]! >> 22n) - (ids[0]! >> 22n));

        // expects ids to have the same (close to) timestamp.
        expect(timestamp_difference).toEqual(0);
    });

    test('not generate overlapping ids', () => {
        const ids: Set<bigint> = new Set();

        // generate the maximum amount of ids per millisecond.
        for (let index = 0; index < 0x3FFF; index++) {
            ids.add(Snowflake.generate());
        }

        // expects that each generated snowflake is unique.
        expect(ids.size).toBe(0x3FFF);

        // expects that no more snowflakes can be generated.
        expect(Snowflake.generate).toThrowError(RangeError);
    });

    test('throw an error if the clock moves backward', () => {
        Snowflake.generate(); // generate a value for lastTime.

        // move the mocked clock backward.
        mocked_timestamp -= 10;

        // expects this to fail to prevent duplicate Ids.
        expect(() => Snowflake.generate()).toThrow('Clock moved backwards. Refusing to generate id');
    });

    describe('components', () => {
        test('handle predictable timestamps if supplied', () => {
            // expects ids timestamp to match the predefined performance.now().
            expect(Snowflake.generate() >> 22n).toBe(42n);

            mocked_epoch = 1420042000000;
            Snowflake.configure({ epoch: mocked_epoch });

            expect(Snowflake.generate() >> 22n).toBe(42n);
        });

        test('handle and reset increments when time changes', () => {
            const ids = [Snowflake.generate()];

            // increase the mocked time.
            mocked_timestamp += 1;

            // generate another id with the increased timestamp.
            ids.push(Snowflake.generate());

            // expects both ids with an increment of zero.
            expect(ids[0]! & 0x3FFFn).toBe(0n);
            expect(ids[1]! & 0x3FFFn).toBe(0n);
        });

        test('handle worker and process identifiers if supplied', () => {
            const mocked_workerid = 3n;
            const mocked_processid = 6n;

            Snowflake.configure({ workerId: mocked_workerid, processId: mocked_processid });

            // generate the expected identifiers from mock values.
            const expected_identifiers = (mocked_workerid << 4n) | mocked_processid;

            // expects cheese.
            expect((Snowflake.generate() & 0x3ff000n) >> 14n).toBe(expected_identifiers);
        });

        test('wrap workerId and processId if they exceed the 4-bit limit', () => {
            Snowflake.configure({ workerId: 17n, processId: 19n });

            const id = Snowflake.generate();
            const workerId = (id & 0x3C0000n) >> 18n;
            const processId = (id & 0x3C000n) >> 14n;

            // expects workerId and processId to wrap around 16 (2^4).
            expect(workerId).toBe(1n);
            expect(processId).toBe(3n);
        });
    });
});