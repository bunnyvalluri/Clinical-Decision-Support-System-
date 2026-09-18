# TLS & Encryption Standards

## Transport Security Policy
- **Minimum Protocol**: TLS 1.3 enforced on edge ingress; TLS 1.2 minimum acceptable for backend legacy connections.
- **Cipher Suites**: Strong ECDHE and AES-GCM suites only; RC4, 3DES, and CBC modes disabled.
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` enabled in reverse proxy.
- **S3 Bucket Invariant**: Insecure HTTP access is denied at the bucket policy level (`aws:SecureTransport: "false"` denial).
