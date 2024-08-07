# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added:

- RS-31: `Bucket.update` and `Bucket.beginUpdateBatch` methods for changing labels, [PR-89](https://github.com/reductstore/reduct-js/pull/89)
- RS-394: Add query support for browser, [PR-90](https://github.com/reductstore/reduct-js/pull/90)

## [1.10.1] - 2024-07-01

### Fixed:

- RS-319: fix name convention for replication settings, [PR-88](https://github.com/reductstore/reduct-js/pull/88)

## [1.10.0] - 2024-06-11

### Added:

- RS-261: add `each_n` and `each_s` query parameters, [PR-85](https://github.com/reductstore/reduct-js/pull/85)
- RS-311: add `each_s` and `each_n` replication settings, [PR-86](https://github.com/reductstore/reduct-js/pull/86)

### Changed:

- RS-234: Integrate prettier to CI and reformat code, [PR-84](https://github.com/reductstore/reduct-js/pull/84)
- RS-269: move documentation to main website, [PR-87](https://github.com/reductstore/reduct-js/pull/87)

## [1.9.3] - 2024-04-26

### Changed:

- Update GitHub actions to get rid of warnings, [PR-82](https://github.com/reductstore/reduct-js/pull/82)

### Fixed:

- Batch class in index.ts, [PR-83](https://github.com/reductstore/reduct-js/pull/83)

## [1.9.2] - 2024-03-22

### Fixed:

- RS-224: Use https Agent only outside browser environment, [PR-81](https://github.com/reductstore/reduct-js/pull/81/files)

## [1.9.1] - 2024-03-20

### Changed:

- RS-223: Revert axios port to 0.x version, [PR-80](https://github.com/reductstore/reduct-js/pull/80)

## [1.9.0] - 2024-03-08

### Added:

- RS-183: Add verifySSL option to ClientOptions, [PR-78](https://github.com/reductstore/reduct-js/pull/78)
- RS-178: Add license information to ServerInfo, [PR-79](https://github.com/reductstore/reduct-js/pull/79)

### Changed:

- RS-122: Update axios up to 1.6 and other dev dependencies, [PR-77](https://github.com/reductstore/reduct-js/pull/77)

## [1.8.0] - 2024-01-22

### Added:

- RS-46: Support Replication API, [PR-76](https://github.com/reductstore/reduct-js/pull/76)

### Changed:

- docs: update link to new website, [PR-75](https://github.com/reductstore/reduct-js/pull/75)

## [1.7.4] - 2023-11-04

### Fixed:

- RS-74: Fix content length limit, [PR-74](https://github.com/reductstore/reduct-js/pull/74)

## [1.7.3] - 2023-10-29

### Fixed:

- RS-57: `MaxListenersExceededWarning` warn in `Bucket.query`, [PR-73](https://github.com/reductstore/reduct-js/pull/73)

## [1.7.2] - 2023-10-28

### Fixed:

- RS-56: Queering batched records, [PR-71](https://github.com/reductstore/reduct-js/pull/71)

## [1.7.1] - 2023-10-11

### Fixed:

- Backward compatibility, isProvisioned field is optional, [PR-69](https://github.com/reductstore/reduct-js/pull/69)

## [1.7.0] - 2023-10-06

### Added:

- Support for ReductStore API v1.7: `isProvisioned` flag for `BucketInfo` and `Token` and `Bucket.beginWriteBatch`
  method for batch writing, [PR-68](https://github.com/reductstore/reduct-js/pull/68)

## [1.6.0] - 2023-08-15

### Added:

- `Bucket.remove_entry` method to remove entry from bucket, [PR-65](https://github.com/reductstore/reduct-js/pull/65)
- `limit` option to `Bucket.query`, [PR-66](https://github.com/reductstore/reduct-js/pull/66)

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

- QuotaType in index.js, [PR-9](https://github.com/reduct-storage/reduct-js/pull/9)

## [0.1.0] - 2022-04-14

- Initial release

[Unreleased]: https://github.com/reduct-storage/reduct-js/compare/v1.10.1...HEAD
[1.10.1]: https://github.com/reduct-storage/reduct-js/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/reduct-storage/reduct-js/compare/v1.9.3...v1.10.0
[1.9.3]: https://github.com/reduct-storage/reduct-js/compare/v1.9.2...v1.9.3
[1.9.2]: https://github.com/reduct-storage/reduct-js/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/reduct-storage/reduct-js/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/reduct-storage/reduct-js/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/reduct-storage/reduct-js/compare/v1.7.3...v1.8.0
[1.7.3]: https://github.com/reduct-storage/reduct-js/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/reduct-storage/reduct-js/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/reduct-storage/reduct-js/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/reduct-storage/reduct-js/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/reduct-storage/reduct-js/compare/v1.5.0...v1.6.0
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
