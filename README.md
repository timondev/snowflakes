# Snowflakes

A distributed unique ID generator based on Twitter's Snowflake algorithm, written in TypeScript.

This package generates 64-bit `bigint` IDs that are guaranteed to be unique within a distributed system and ensures that IDs are roughly time-sortable.

## Features

- **Unique**: Generates 64-bit unique identifiers.
- **Time-sortable**: IDs are ordered by creation time.
- **Distributed**: Supports multiple workers and processes to ensure uniqueness across a cluster.
- **High Performance**: capable of generating up to 16,384 unique IDs per millisecond per node.
- **Zero Dependencies**: Lightweight and fast.

## Installation

```bash
npm install snowflakes
# or
yarn add snowflakes
# or
pnpm add snowflakes
# or
bun add snowflakes
```

## Usage

### Basic Usage

```typescript
import { Snowflake } from 'snowflakes';

// Generate a unique ID
const id = Snowflake.generate();
console.log(id); // e.g., 159958744000000000n
```

### Configuration

You can configure the generator with a custom epoch, worker ID, and process ID. This is useful if you are running multiple instances of the generator in a distributed environment.

```typescript
import { Snowflake } from 'snowflakes';

Snowflake.configure({
  epoch: 1609459200000, // Custom epoch (e.g., Jan 1, 2021)
  workerId: 1n,         // Worker ID (0-15)
  processId: 2n         // Process ID (0-15)
});

const id = Snowflake.generate();
```

## API

### `Snowflake.generate(): bigint`

Generates a unique 64-bit Snowflake ID.

- **Returns**: A `bigint` representing the unique ID.
- **Throws**: `RangeError` if the increment limit (16,384) is exceeded for the current millisecond.
- **Throws**: `Error` if the system clock moves backwards.

### `Snowflake.configure(options)`

Configures the Snowflake generator.

**Options:**

- `epoch` (optional): A custom epoch timestamp (in milliseconds). Defaults to `1420070400000` (Twitter Snowflake epoch).
- `workerId` (optional): A unique identifier for the worker (0-15). Defaults to `process.env.NODE_UNIQUE_ID` or `0`.
- `processId` (optional): A unique identifier for the process (0-15). Defaults to `process.pid`.

## ID Structure

Snowflakes are 64-bit integers consisting of 3 components:

| Component                | Bits    | Description                                                    |
| ------------------------ | ------- | -------------------------------------------------------------- |
| **Timestamp**            | 42 bits | Milliseconds since the custom epoch.                           |
| **Internal Identifiers** | 8 bits  | 4 bits for Worker ID + 4 bits for Process ID.                  |
| **Increment**            | 14 bits | Sequence number for IDs generated within the same millisecond. |

## License

MIT
