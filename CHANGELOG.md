# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added:

- Support Reduct Storage API v0.7, [PR-40](https://github.com/reduct-storage/reduct-js/pull/40)

## [0.6.0] - 2022-07-29

### Added:

- Support Reduct Storage API v0.7, [PR-37](https://github.com/reduct-storage/reduct-js/pull/37)

### Removed:

- Hash for API token and `sjcl` from dependencies [PR-38](https://github.com/reduct-storage/reduct-js/pull/38)

## [0.5.1] - 2022-07-17

### Fixed:

- BucketSetting serialisation, [PR-35](https://github.com/reduct-storage/reduct-js/pull/35)

## [0.5.0] - 2022-07-05

### Added:

- Reduct Storage API v0.6, [PR-29](https://github.com/reduct-storage/reduct-js/pull/29)
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

[Unreleased]: https://github.com/reduct-storage/reduct-js/compare/v0.5.1...HEAD

[0.6.0]: https://github.com/reduct-storage/reduct-js/compare/v0.5.1...v0.6.0

[0.5.1]: https://github.com/reduct-storage/reduct-js/compare/v0.5.0...v0.5.1

[0.5.0]: https://github.com/reduct-storage/reduct-js/compare/v0.4.1...v0.5.0

[0.4.1]: https://github.com/reduct-storage/reduct-js/compare/v0.4.0...v0.4.1

[0.4.0]: https://github.com/reduct-storage/reduct-js/compare/v0.3.0...v0.4.0

[0.3.0]: https://github.com/reduct-storage/reduct-js/compare/v0.2.0...v0.3.0

[0.2.0]: https://github.com/reduct-storage/reduct-js/compare/v0.1.0...v0.2.0

[0.1.0]: https://github.com/reduct-storage/reduct-js/compare/tag/v0.1.0
