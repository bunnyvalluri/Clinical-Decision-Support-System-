# DNS & Domain Routing

## DNS Configuration (Route53)

- **Apex Domain**: `healthnova.ai`
- **Application Record**: `app.healthnova.ai` (Alias to ALB)
- **API Record**: `api.healthnova.ai` (Alias to ALB)
- **CAA Records**:
  - `0 issue "amazon.com"`
  - `0 issue "letsencrypt.org"`
  - `0 issuewild ";"`
  - `0 iodef "mailto:security@healthnova.ai"`
  - Restricts unauthorized CA certificate issuance.
