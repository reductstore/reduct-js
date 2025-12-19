import { BucketInfo, OriginalBucketInfo } from "../src/messages/BucketInfo";
import { EntryInfo } from "../src/messages/EntryInfo";
import { Status } from "../src/messages/Status";

describe("Status", () => {
  it("should parse BucketInfo with status field", () => {
    const original: OriginalBucketInfo = {
      name: "test-bucket",
      entry_count: "5",
      size: "1024",
      oldest_record: "1000000",
      latest_record: "2000000",
      is_provisioned: false,
      status: "READY",
    };

    const info = BucketInfo.parse(original);
    expect(info.status).toEqual(Status.READY);
  });

  it("should parse BucketInfo with DELETING status", () => {
    const original: OriginalBucketInfo = {
      name: "test-bucket",
      entry_count: "5",
      size: "1024",
      oldest_record: "1000000",
      latest_record: "2000000",
      is_provisioned: false,
      status: "DELETING",
    };

    const info = BucketInfo.parse(original);
    expect(info.status).toEqual(Status.DELETING);
  });

  it("should default to READY status when not provided in BucketInfo", () => {
    const original: OriginalBucketInfo = {
      name: "test-bucket",
      entry_count: "5",
      size: "1024",
      oldest_record: "1000000",
      latest_record: "2000000",
      is_provisioned: false,
    };

    const info = BucketInfo.parse(original);
    expect(info.status).toEqual(Status.READY);
  });

  it("should parse EntryInfo with status field", () => {
    const original = {
      name: "test-entry",
      block_count: "3",
      record_count: "10",
      size: "512",
      oldest_record: "1000000",
      latest_record: "2000000",
      status: "READY",
    };

    const info = EntryInfo.parse(original);
    expect(info.status).toEqual(Status.READY);
  });

  it("should parse EntryInfo with DELETING status", () => {
    const original = {
      name: "test-entry",
      block_count: "3",
      record_count: "10",
      size: "512",
      oldest_record: "1000000",
      latest_record: "2000000",
      status: "DELETING",
    };

    const info = EntryInfo.parse(original);
    expect(info.status).toEqual(Status.DELETING);
  });

  it("should default to READY status when not provided in EntryInfo", () => {
    const original = {
      name: "test-entry",
      block_count: "3",
      record_count: "10",
      size: "512",
      oldest_record: "1000000",
      latest_record: "2000000",
    };

    const info = EntryInfo.parse(original);
    expect(info.status).toEqual(Status.READY);
  });
});
