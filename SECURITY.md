# Security Policy

## Supported Versions

The following table indicates the versions of **Grid Motors API** currently receiving security updates.

| Version | Branch / Target | Supported          | Notes |
| :--- | :--- | :---: | :--- |
| `1.x`   | `develop` / `main` | :white_check_mark: | Active development & modernization baseline |
| `1.0.0` | `tags/v1.0.0`      | :x:                | Original bootcamp challenge release (frozen) |
| `< 1.0` | Legacy / Dev       | :x:                | Unsupported pre-releases |

---

## Reporting a Vulnerability

We take the security of Grid Motors seriously. If you believe you have found a security vulnerability in this project, **please do not report it through public GitHub issues, pull requests, or public discussions.**

### Preferred Reporting Method

Please use **GitHub Private Vulnerability Reporting**:
1. Navigate to the [Security tab of this repository](https://github.com/niqueborges/grid-motors/security).
2. Click on **Advisories** in the sidebar.
3. Click **Report a vulnerability**.
4. Fill in the details of the issue with actionable reproduction steps.

Alternatively, you may reach out directly to the maintainer via email:
- **Contact:** `95103547+niqueborges@users.noreply.github.com` (or your preferred security contact email)

### What to Include in Your Report

To help us triage and resolve the issue quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step instructions to reproduce the issue (PoC scripts, HTTP request samples, or payloads).
- The affected component or route (e.g., `/auth`, JWT validation, Prisma query, CORS, headers).
- Environment details (Node.js version, operating system, Docker setup).

---

## Response & Disclosure Process

1. **Acknowledgment:** We will acknowledge receipt of your vulnerability report within **48–72 hours**.
2. **Investigation & Assessment:** We will verify the issue, assess its severity, and determine the fix.
3. **Patch & Release:** A fix will be developed on a private security branch and validated via automated CI pipelines before merging into `develop` and tagging a release.
4. **Coordinated Disclosure:** We adhere to responsible disclosure principles. Once a fix is released, a security advisory will be published crediting the reporter (unless anonymity is requested).

---

## Security Practices in Grid Motors

This project implements several baseline security practices:
- **Authentication & RBAC:** Stateless JWT bearer tokens with Passport strategies.
- **Input Validation:** Strict DTO validation and transformation via `class-validator` and `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`).
- **Rate Limiting:** Protection against brute-force attacks via `@nestjs/throttler`.
- **Dependency Management:** Continuous automated vulnerability audits via GitHub Dependabot and CodeQL scanning.
- **Principle of Least Privilege:** GitHub Actions workflows restricted to `contents: read` permissions.
