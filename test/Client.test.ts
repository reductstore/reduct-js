import {Client} from "../src/Client";
import {ServerInfo} from "../src/ServerInfo";


test("Client should raise network error", () => {
    const client = new Client("http://127.0.0.2:80");
    expect(client.getInfo()).rejects.toEqual({
        message: "connect ECONNREFUSED 127.0.0.2:80"
    });
})

describe("Client", () => {
    const client = new Client("http://127.0.0.1:8383");
    it("should get information about the server", async () => {
        const info: ServerInfo = await client.getInfo();

        expect(info.version).toMatch(/0\.[0-9]+\.[0-9]+/);
        expect(info.bucket_count).toBeGreaterThanOrEqual(0);
        expect(info.usage).toBeGreaterThanOrEqual(0);
        expect(info.uptime).toBeGreaterThanOrEqual(0);
        expect(info.oldest_record).toBeGreaterThanOrEqual(0);
        expect(info.latest_record).toBeGreaterThanOrEqual(0);
    });
})
