import { HttpClient } from "../src/http/HttpClient";
import * as https from "https";

// Self-signed cert for "localhost" only — no IP SANs.
// Connecting via 127.0.0.1 triggers ERR_TLS_CERT_ALTNAME_INVALID without SSL bypass.
const KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgVWdf7cVm6GAp8w9Y
N1BgZ0uRAj9T0LASYElRPa3jzzOhRANCAAQlzH0/CKMDcwWkLMj7ykFQ+BWPyL+Z
J5mbhjKeB82BF50no83LbmiKjS65/aaknxHp/c2LMWn0hEV2LB10OpUt
-----END PRIVATE KEY-----`;

const CERT = `-----BEGIN CERTIFICATE-----
MIIBfTCCASOgAwIBAgIUQvNKe6oXVgTR/d9IG2gxOlfdpeYwCgYIKoZIzj0EAwIw
FDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDQxMTEwMTUyNloXDTM2MDQwODEw
MTUyNlowFDESMBAGA1UEAwwJbG9jYWxob3N0MFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAEJcx9PwijA3MFpCzI+8pBUPgVj8i/mSeZm4YyngfNgRedJ6PNy25oio0u
uf2mpJ8R6f3NizFp9IRFdiwddDqVLaNTMFEwHQYDVR0OBBYEFEgiuREolOYYe9ww
S+E6bgikjvIbMB8GA1UdIwQYMBaAFEgiuREolOYYe9wwS+E6bgikjvIbMA8GA1Ud
EwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSAAwRQIhAN5W0vdHh/4fMui0v8l7CYIx
vp5KvFL5iWnFHYLGzaZkAiAxfl5VGg0EEVHkfbsersggWTdRJaZiLd4nSJg01sY4
hw==
-----END CERTIFICATE-----`;

function startServer(): Promise<{ port: number; server: https.Server }> {
  return new Promise((resolve) => {
    const server = https.createServer({ key: KEY, cert: CERT }, (_req, res) => {
      res.setHeader("content-type", "application/json");
      res.setHeader("x-reduct-api", "1.19");
      res.end(JSON.stringify({ version: "test" }));
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ port, server });
    });
  });
}

test("verifySSL=false should bypass certificate validation when connecting via IP", async () => {
  const { port, server } = await startServer();
  try {
    const client = new HttpClient(`https://127.0.0.1:${port}`, {
      verifySSL: false,
    });

    const result = await client.get("/info");
    expect(result.status).toBe(200);
  } finally {
    server.close();
  }
});

test("verifySSL=true should reject mismatched certificate when connecting via IP", async () => {
  const { port, server } = await startServer();
  try {
    const client = new HttpClient(`https://127.0.0.1:${port}`, {
      verifySSL: true,
    });

    await expect(client.get("/info")).rejects.toThrow();
  } finally {
    server.close();
  }
});
