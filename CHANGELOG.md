# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2023-06-30

### Added:

- Support for `GET /api/v1/b/:bucket/:entry/batch` endpoint, [PR-62](https://github.com/reductstore/reduct-js/pull/62) 
- Option `head` to `Bucket.query` and `Bucket.beginRead`, [PR-63](https://github.com/reductstore/reduct-js/pull/63)

## [1.4.1] - 2023-06-03

### Fixed:

- Sending a record as Buffer, [PR-60](https://github.com/reductstore/reduct-js/pull/60)

## [1.4.0] - 2023-05-29

### Added:

- Implement continuous query, [PR-59](https://github.com/reductstore/reduct-js/pull/59)

### Changed:

- Fix JSON parsing for big integers (for Rust implementation), [PR-58](https://github.com/reductstore/reduct-js/pull/58)

## [1.3.0] - 2023-02-09

### Added:

- Quick Start example and guide, [PR-54](https://github.com/reductstore/reduct-js/pull/54)
- Support labels for read, write and querying, [PR-55](https://github.com/reductstore/reduct-js/pull/55)
- Support for content type of records, [PR-57](https://github.com/reductstore/reduct-js/pull/57)

### Changed:

- Use x-reduct-error header for error message, [PR-56](https://github.com/reductstore/reduct-js/pull/56)

### [1.2.0] - 2022-12-23

### Added:

- Add support for ReductStore API version 1.2 with method Client.me to get current
  permissions, [PR-51](https://github.com/reductstore/reduct-js/pull/51)

### Changed:

- Update documentation after rebranding, [PR-50](https://github.com/reductstore/reduct-py/pull/50)

## [1.1.1] - 2022-11-24

### Fixed:

- Add token and permissions to index.ts, [PR-47](https://github.com/reduct-storage/reduct-js/pull/46)

## [1.1.0] - 2022-11-23

### Added:

- Support ReductStore API v1.1 with Token API, [PR-46](https://github.com/reduct-storage/reduct-js/pull/46)

## [1.0.0] - 2022-10-03

### Added:

- Support ReductStore API v1.0, [PR-43](https://github.com/reduct-storage/reduct-js/pull/43)

### Removed:

- `Bucket.list` method, [PR-43](https://github.com/reduct-storage/reduct-js/pull/43)
- `Bucket.readStream`, `Bucket.writeStream` methods, [PR-44](https://github.com/reduct-storage/reduct-js/pull/44)

### Changes:

- `Bucket.read`, `Bucket.write` methods, [PR-44](https://github.com/reduct-storage/reduct-js/pull/44)

## [0.7.0] - 2022-08-27

### Added:

- Support ReductStore API v0.8, [PR-40](https://github.com/reduct-storage/reduct-js/pull/40)

## [0.6.0] - 2022-07-29

### Added:

- Support ReductStore API v0.7, [PR-37](https://github.com/reduct-storage/reduct-js/pull/37)

### Removed:

- Hash for API token and `sjcl` from dependencies [PR-38](https://github.com/reduct-storage/reduct-js/pull/38)

## [0.5.1] - 2022-07-17

### Fixed:

- BucketSetting serialisation, [PR-35](https://github.com/reduct-storage/reduct-js/pull/35)

## [0.5.0] - 2022-07-05

### Added:

- ReductStore API v0.6, [PR-29](https://github.com/reduct-storage/reduct-js/pull/29)
- Data streaming, [PR-30](https://github.com/reduct-storage/reduct-js/pull/30)
- Original exception to APIError, [PR-31](https://github.com/reduct-storage/reduct-js/pull/31)

### Fixed:

- Minor Typo, [PR-26](https://github.com/reduct-storage/reduct-js/pull/26)

### [0.4.1] - 2022-06-24

### Fixed:

- Updating refresh token, [PR-24](https://github.com/reduct-storage/reduct-js/pull/24)

## [0.4.0] - 2022-05-19

### Added:

- Support Reduct HTTP API v0.5, [PR-21](https://github.com/reduct-storage/reduct-js/pull/21)
- Timeout to ClientOptions, [PR-22](https://github.com/reduct-storage/reduct-js/pull/22)

## [0.3.0] - 2022-04-30

### Added:

- Use Buffer read and write records, [PR-18](https://github.com/reduct-storage/reduct-js/pull/18)

### Changed:

- `bigint` instead of `BigInt`, [PR-13](https://github.com/reduct-storage/reduct-js/pull/13)

### Fixed:

- Reading big records [PR-16](https://github.com/reduct-storage/reduct-js/pull/16)
- Signature of Bucket.list [PR-17](https://github.com/reduct-storage/reduct-js/pull/17)

## [0.2.0] - 2022-04-16

### Added:

- `Client.getOrCreateBucket` method, [PR-10](https://github.com/reduct-storage/reduct-js/pull/10)

### Fixed:

* QuotaType in index.js, [PR-9](https://github.com/reduct-storage/reduct-js/pull/9)

## [0.1.0]  - 2022-04-14

- Initial release

[Unreleased]: https://github.com/reduct-storage/reduct-js/compare/v1.5.0...HEAD

[1.5.0]: https://github.com/reduct-storage/reduct-js/compare/v1.4.1...v1.5.0

[1.4.1]: https://github.com/reduct-storage/reduct-js/compare/v1.4.0...v1.4.1

[1.4.0]: https://github.com/reduct-storage/reduct-js/compare/v1.3.0...v1.4.0

[1.3.0]: https://github.com/reduct-storage/reduct-js/compare/v1.2.0...v1.3.0

[1.2.0]: https://github.com/reduct-storage/reduct-js/compare/v1.1.1...v1.2.0

[1.1.1]: https://github.com/reduct-storage/reduct-js/compare/v1.1.0...v1.1.1

[1.1.0]: https://github.com/reduct-storage/reduct-js/compare/v1.0.0...v1.1.0

[1.0.0]: https://github.com/reduct-storage/reduct-js/compare/v0.7.0...v1.0.0

[0.7.0]: https://github.com/reduct-storage/reduct-js/compare/v0.6.0...v0.7.0

[0.6.0]: https://github.com/reduct-storage/reduct-js/compare/v0.5.1...v0.6.0

[0.5.1]: https://github.com/reduct-storage/reduct-js/compare/v0.5.0...v0.5.1

[0.5.0]: https://github.com/reduct-storage/reduct-js/compare/v0.4.1...v0.5.0

[0.4.1]: https://github.com/reduct-storage/reduct-js/compare/v0.4.0...v0.4.1

[0.4.0]: https://github.com/reduct-storage/reduct-js/compare/v0.3.0...v0.4.0

[0.3.0]: https://github.com/reduct-storage/reduct-js/compare/v0.2.0...v0.3.0

[0.2.0]: https://github.com/reduct-storage/reduct-js/compare/v0.1.0...v0.2.0

[0.1.0]: https://github.com/reduct-storage/reduct-js/compare/tag/v0.1.0
