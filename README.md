<a id="readme-top"></a>



<!-- PROJECT SHIELDS -->
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">@timondev/snowflakes</h3>
  <p align="center">
    A distributed unique ID generator based on Twitter's Snowflake algorithm, written in TypeScript.
    <br />
    <a href="https://github.com/timondev/snowflakes"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://www.npmjs.com/package/@timondev/snowflakes">View Package</a>
    &middot;
    <a href="https://github.com/timondev/snowflakes/issues/new">Report Bug / Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Snowflakes Benchmark Screen Shot][product-screenshot]](https://github.com/timondev/snowflakes)

Generates unique, time-sortable 64-bit `bigint` IDs for distributed systems.

Written with bun, works in node.js but with worse performance (~40ns / iter).

### Features

- **Unique**: Generates 64-bit unique identifiers.
- **Time-sortable**: IDs are ordered by creation time.
- **Distributed**: Supports multiple workers and processes to ensure uniqueness across a cluster.
- **High Performance**: Generates up to 16,384 IDs per millisecond per node.
- **Zero Dependencies**: Lightweight and fast.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Installation

```bash
npm install @timondev/snowflakes
# or
yarn add @timondev/snowflakes
# or
pnpm add @timondev/snowflakes
# or
bun add @timondev/snowflakes
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Basic Usage

```typescript
import { Snowflake } from '@timondev/snowflakes';

// Generate a unique ID
const id = Snowflake.generate();
console.log(id); // e.g., 159958744000000000n
```

### Configuration

Configure custom epoch, worker ID, and process ID for distributed environments.

```typescript
import { Snowflake } from '@timondev/snowflakes';

Snowflake.configure({
  epoch: 1609459200000, // Custom epoch (e.g., Jan 1, 2021)
  workerId: 1n,         // Worker ID (0-15)
  processId: 2n         // Process ID (0-15)
});

const id = Snowflake.generate();
```

### API

`Snowflake.generate(): bigint`

Generates a unique 64-bit ID.

- **Returns**: A `bigint` representing the unique ID.
- **Throws**: `RangeError` if the increment limit (16,384) is exceeded for the current millisecond.
- **Throws**: `Error` if the system clock moves backwards.

`Snowflake.configure(options)`

Configures the Snowflake generator.

**Options:**

- `epoch` (optional): Custom epoch timestamp (in milliseconds). Defaults to `1420070400000` (Twitter Snowflake epoch).
- `workerId` (optional): Worker identifier (0-15). Defaults to `process.env.NODE_UNIQUE_ID` or `0`.
- `processId` (optional): Process identifier (0-15). Defaults to `process.pid`.

### ID Structure

IDs consist of 3 components:

| Component                | Bits    | Description                                                    |
| ------------------------ | ------- | -------------------------------------------------------------- |
| **Timestamp**            | 42 bits | Milliseconds since the custom epoch.                           |
| **Internal Identifiers** | 8 bits  | 4 bits for Worker ID + 4 bits for Process ID.                  |
| **Increment**            | 14 bits | Sequence number for IDs generated within the same millisecond. |

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/timondev/snowflakes/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=timondev/snowflakes" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

Copyright 2025 timondev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/timondev/snowflakes.svg?style=for-the-badge
[contributors-url]: https://github.com/timondev/snowflakes/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/timondev/snowflakes.svg?style=for-the-badge
[forks-url]: https://github.com/timondev/snowflakes/network/members
[stars-shield]: https://img.shields.io/github/stars/timondev/snowflakes.svg?style=for-the-badge
[stars-url]: https://github.com/timondev/snowflakes/stargazers
[issues-shield]: https://img.shields.io/github/issues/timondev/snowflakes.svg?style=for-the-badge
[issues-url]: https://github.com/timondev/snowflakes/issues
[license-shield]: https://img.shields.io/github/license/timondev/snowflakes.svg?style=for-the-badge
[license-url]: https://github.com/timondev/snowflakes/blob/release/main/LICENSE
[product-screenshot]: .github/resources/snowflake-benchmark.png
[Bun.js]: https://img.shields.io/badge/bun-000000?style=for-the-badge&logo=bun&logoColor=white
[Bun-url]: https://bun.com/