# Security Policy

## Supported Versions

The following versions of SafeBeat AI are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.8.x   | :white_check_mark: |
| < 2.8   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within SafeBeat AI, please send an email to the maintainers. All security vulnerabilities will be promptly addressed.

**Please do not open public issues for security vulnerabilities.**

Include the following details in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices for Deployment

- **Do not expose the backend directly to the public internet** without a reverse proxy (e.g., Nginx, Traefik).
- **Use HTTPS** in production environments.
- **Keep dependencies up to date** by regularly running `pip install --upgrade` and `npm update`.
- **Run containers as non-root** where possible (the backend Dockerfile already includes a non-root user).
- **Set strong CORS origins** instead of `*` in production via the `CORS_ORIGINS` environment variable.
- **Enable rate limiting** and monitor logs for abuse.

## Disclosure Policy

Once a security issue is fixed, we will publish a security advisory detailing the vulnerability, affected versions, and mitigation steps.
