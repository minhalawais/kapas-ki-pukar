# Phase 02 Security Risk Decision

**Decision:** Approved as a temporary, scoped exception  
**Decision date:** 2026-10-17  
**Review/expiry date:** 2027-01-15, or immediately when a patched upstream release is available  
**Owner:** PUWF Security Reviewer (temporary role owner)

## Scope

This decision covers only these two high-severity transitive findings reported by `pnpm audit`:

| Advisory            | Package      | Reachability in this project                          | Upstream status             |
| ------------------- | ------------ | ----------------------------------------------------- | --------------------------- |
| GHSA-86w9-cpqp-85rv | `node-forge` | Expo CLI/build tooling                                | No patched release reported |
| GHSA-vfj7-8cjw-p6xm | `braces`     | Metro/micromatch and other build-time glob processing | No patched release reported |

The exception does not apply to a production server dependency, a container-image finding, a critical vulnerability, or any new advisory. The final API and worker images were independently scanned with Trivy and contain zero fixed CRITICAL/HIGH findings.

## Decision basis

The project owner authorized automatic approval of Phase 02 gates. The temporary PUWF security-owner role accepts these two findings because they are confined to developer/mobile build tooling, no patched upstream version is currently available, and the application does not intentionally process attacker-supplied cryptographic material or glob expressions through these tools at runtime.

This is a time-boxed risk acceptance, not a statement that the affected packages are safe.

## Required controls

- Keep the lockfile committed and use frozen installs in CI.
- Keep the audit result visible; do not mute or suppress either advisory.
- Fail verification on any critical dependency finding.
- Do not feed untrusted certificates, PKCS structures, archives, paths, or glob patterns into the affected build tools.
- Keep production images free of build tooling and scan them for fixed CRITICAL/HIGH findings.
- Review Expo, Metro, micromatch, `node-forge`, and `braces` updates at least monthly.
- Replace this temporary role approval with a named PUWF security reviewer before production launch.

## Revocation conditions

This exception is revoked if a patched compatible release becomes available, reachability changes, exploit evidence appears, the advisory severity increases, or the review date is reached. In any of those cases, update the dependency graph and rerun the complete Phase 02 verification before release.
