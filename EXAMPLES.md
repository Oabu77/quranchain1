# Service and Tunnel Connection Examples

## Overview
This document provides examples of how to use the service proxy and tunnel endpoints.

## Main Service Connection

The `/service/:path` endpoint allows you to proxy requests to a Cloudflare Worker bound via service bindings.

### Configuration
Update `wrangler.jsonc` to bind your service:

```jsonc
"services": [
  {
    "binding": "MAIN_SERVICE",
    "service": "your-worker-name"
  }
]
```

### Usage Examples

**GET Request:**
```bash
curl https://your-worker.workers.dev/service/api/users
```

**POST Request:**
```bash
curl -X POST https://your-worker.workers.dev/service/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
```

## Tunnel Connection

The `/tunnel/:path` endpoint allows you to forward requests to an external HTTP service via a tunnel URL.

### Configuration
Update `wrangler.jsonc` to set your tunnel URL:

```jsonc
"vars": {
  "TUNNEL_URL": "https://your-tunnel-domain.com"
}
```

### Usage Examples

**GET Request:**
```bash
curl https://your-worker.workers.dev/tunnel/api/data
```

**POST Request:**
```bash
curl -X POST https://your-worker.workers.dev/tunnel/api/data \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## OpenAPI Documentation

Both endpoints are documented in the OpenAPI schema. Visit your worker's root URL to see the interactive API documentation.

## Security Considerations

1. **Service Bindings**: Only accessible within your Cloudflare account
2. **Tunnel URLs**: Ensure the tunnel URL is secure (HTTPS) and trusted
3. **Request Validation**: Consider adding authentication middleware if needed
4. **Rate Limiting**: Implement rate limiting for production use
