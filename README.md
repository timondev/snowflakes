# Snowflakes

A distributed unique ID generator based on Twitter's Snowflake algorithm, written in TypeScript.

Generates unique, time-sortable 64-bit `bigint` IDs for distributed systems.

## Features

- **Unique**: Generates 64-bit unique identifiers.
- **Time-sortable**: IDs are ordered by creation time.
- **Distributed**: Supports multiple workers and processes to ensure uniqueness across a cluster.
- **High Performance**: Generates up to 16,384 IDs per millisecond per node.
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

Configure custom epoch, worker ID, and process ID for distributed environments.

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

Generates a unique 64-bit ID.

- **Returns**: A `bigint` representing the unique ID.
- **Throws**: `RangeError` if the increment limit (16,384) is exceeded for the current millisecond.
- **Throws**: `Error` if the system clock moves backwards.

### `Snowflake.configure(options)`

Configures the Snowflake generator.

**Options:**

- `epoch` (optional): Custom epoch timestamp (in milliseconds). Defaults to `1420070400000` (Twitter Snowflake epoch).
- `workerId` (optional): Worker identifier (0-15). Defaults to `process.env.NODE_UNIQUE_ID` or `0`.
- `processId` (optional): Process identifier (0-15). Defaults to `process.pid`.

## ID Structure

IDs consist of 3 components:

| Component                | Bits    | Description                                                    |
| ------------------------ | ------- | -------------------------------------------------------------- |
| **Timestamp**            | 42 bits | Milliseconds since the custom epoch.                           |
| **Internal Identifiers** | 8 bits  | 4 bits for Worker ID + 4 bits for Process ID.                  |
| **Increment**            | 14 bits | Sequence number for IDs generated within the same millisecond. |

## License

Apache-2.0
