# ADR 0002: Node.js Runtime Version

- **Status:** Accepted
- **Date:** 2026-11-07
- **Project:** Grid Motors API

## 1. Context

The project currently uses Node.js 20 in its Dockerfile and CI
configuration.

The package manifest does not declare a Node.js engine requirement.
The project also uses TypeScript definitions from the Node.js 24 line.

Node.js 20 has reached end of life. The runtime must be updated to
a supported LTS release.

## 2. Decision

Adopt **Node.js 26 LTS** as the target runtime for the modernization.

The target version must be consistently applied to:

- Local development environment.
- Node.js version declaration.
- `package.json` engine requirements.
- Docker build and runtime images.
- Continuous integration workflows.

## 3. Rationale

Node.js 26 is in Active LTS.

The project uses NestJS 11 and Prisma 7. Their documented runtime
requirements do not establish a general incompatibility with Node.js 26.

Choosing the current Active LTS release provides a longer support
horizon than adopting the Maintenance LTS release.

The decision avoids retaining an end-of-life runtime merely to
minimize short-term changes.

## 4. Validation Requirements

The runtime migration must be validated before the phase is considered
complete.

Validation includes:

- Clean dependency installation using the lockfile.
- Prisma Client generation.
- TypeScript compilation.
- ESLint.
- Unit and end-to-end tests.
- Production build.
- Docker image build and application startup.

Any incompatibility discovered during validation must be investigated
and documented rather than bypassed.

## 5. Consequences

All runtime references must be aligned with Node.js 26.

The dependency tree may require updates if packages or native modules
are incompatible with the selected runtime.

The existing package lockfile must remain consistent with the
dependency manifest.

This decision establishes the target runtime; successful validation
is a separate requirement for completing the implementation phase.
