---
prd_version: 0.1     # PRD version this WBS was last reconciled with
updated: YYYY-MM-DD
source: —            # original document this was imported from, if any
---

# WBS: <Product name>

Decompose by **deliverable**, not activity. Leaf items are work packages.

## Tree
- 1 <Deliverable area>
  - 1.1 <Work package>
  - 1.2 <Work package>
- 2 <Deliverable area>
  - 2.1 <Work package>
- 8 Security (enabler)
  - 8.1 Security baseline (secrets handling, security headers, dependency audit, auth setup)
- 9 Project enablers (enabler)
  - 9.1 Repo setup and tooling
  - 9.2 Test setup

## Work Packages
| WBS | Work package | Deliverable | Requirements | Depends on | Estimate | Status |
|---|---|---|---|---|---|---|
| 1.1 | | | FR-001 | — | S | todo |

Estimate: S (< ½ day), M (½–2 days), L (> 2 days — split it). Status: todo / in-progress / done / dropped.

## Coverage Check
Every `approved` PRD requirement must map to at least one work package. Unmapped requirements:
- (none)
