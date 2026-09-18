# Infrastructure Change Management

## Approval Gate Invariant
All production infrastructure modifications require:
1. Speculative plan artifact attached to a Pull Request.
2. Peer review approval by at least one Senior SRE / DevOps engineer.
3. Explicit human approval token (`CONFIRM_PRODUCTION_APPLY=yes` or UI token).
4. Automated verification test execution post-apply.

## Prohibited Actions
- No direct manual edits in the AWS Web Console for production resources.
- No bypassing DynamoDB state locks with `force-unlock` without incident commander approval.
- No modifying CIDR blocks or terminating host instances during peak hospital operating hours.
