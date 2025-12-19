const { Client, Status } = require("../lib/cjs/index.js");

/**
 * Example demonstrating non-blocking bucket and entry deletions.
 * 
 * When deleting buckets or entries, ReductStore performs the operation
 * asynchronously in the background. During deletion:
 * - The bucket/entry status changes from READY to DELETING
 * - Operations on the resource return HTTP 409 (Conflict) 
 * - Once deletion completes, the resource is fully removed
 */
const main = async () => {
  // 1. Create a ReductStore client
  const client = new Client("http://127.0.0.1:8383");

  // 2. Create a bucket
  const bucket = await client.createBucket("example-bucket");

  // 3. Write some data
  let record = await bucket.beginWrite("sensor-1", BigInt(Date.now()) * 1000n);
  await record.write("Sample data");

  // 4. Check bucket status (should be READY)
  let bucketInfo = await bucket.getInfo();
  console.log(`Bucket status: ${bucketInfo.status}`); // READY

  // 5. Check entry status (should be READY)
  let entries = await bucket.getEntryList();
  console.log(`Entry status: ${entries[0].status}`); // READY

  // 6. Delete the entry (non-blocking)
  await bucket.removeEntry("sensor-1");

  // 7. Immediately check the entry status
  // Note: Depending on server load and data size, the entry might already
  // be deleted or still in DELETING state
  try {
    entries = await bucket.getEntryList();
    const deletingEntry = entries.find((e) => e.name === "sensor-1");
    if (deletingEntry) {
      console.log(`Entry status during deletion: ${deletingEntry.status}`);
      // May show DELETING if checked quickly enough
      
      // Attempting operations on a DELETING entry will fail with HTTP 409
      if (deletingEntry.status === Status.DELETING) {
        console.log("Entry is being deleted. Operations will return HTTP 409.");
      }
    } else {
      console.log("Entry was deleted quickly and is no longer visible");
    }
  } catch (err) {
    console.log(`Entry already deleted: ${err.message}`);
  }

  // 8. Delete the bucket (non-blocking)
  await bucket.remove();

  // 9. Check bucket list to see if bucket is still being deleted
  try {
    const buckets = await client.getBucketList();
    const deletingBucket = buckets.find((b) => b.name === "example-bucket");
    if (deletingBucket && deletingBucket.status === Status.DELETING) {
      console.log("Bucket is in DELETING state");
      // Operations on this bucket will fail with HTTP 409
    } else {
      console.log("Bucket was deleted or not found");
    }
  } catch (err) {
    console.log(`Error checking bucket status: ${err.message}`);
  }
};

main()
  .then(() => console.log("Example completed"))
  .catch((err) => console.error("Error:", err));
