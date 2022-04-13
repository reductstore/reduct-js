import {Bucket} from "../src/Bucket";
import {Client} from "../src/Client";

/**
 * Remove all buckets
 * @param client
 */
export const cleanStorage = async (client: Client): Promise<void> => {
    return client.getBucketList()
        .then(buckets => {
            return Promise.all(buckets.map(info => {
                return client.getBucket(info.name).then((bucket: Bucket) => {
                        return bucket.remove();
                    }
                );
            }));
        }).then(() => Promise.resolve());
};
