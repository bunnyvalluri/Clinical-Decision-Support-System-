# Controlled Browser Agent Tool Registry

The browser automation agent does NOT have arbitrary execution rights. It can only call the following allowlisted tools registered in `BrowserToolRegistry`:

| Tool ID | Name | Risk Tier | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `BROWSER_OPEN_APPROVED_SITE` | Open Approved Site | LOW | ADMIN, INFORMATICIST, CLINICIAN | Navigate to allowlisted destination URL |
| `BROWSER_READ_PUBLIC_PAGE` | Read Public Page | LOW | ADMIN, INFORMATICIST, CLINICIAN | Extract semantic text and article sections |
| `BROWSER_FILL_NON_SENSITIVE_FORM` | Fill Form Field | MEDIUM | ADMIN, INFORMATICIST | Fill search inputs or filters (non-PHI) |
| `BROWSER_CLICK_APPROVED_ELEMENT` | Click Approved Element | MEDIUM | ADMIN, INFORMATICIST | Click indexed elements in observed action space |
| `BROWSER_SCREENSHOT_NON_PHI` | Capture Screenshot | LOW | ADMIN, INFORMATICIST | Capture verification screenshot (PHI masked) |
| `BROWSER_VERIFY_FINAL_PAGE` | Verify Final Page | LOW | ADMIN, INFORMATICIST, CLINICIAN | Independent programmatic post-condition check |

### Tool Invocation Rules
1. Tool invocations are validated against the user's role before execution.
2. Arbitrary JavaScript injection (`eval`, `script` tags) is forbidden.
3. Operating system shell execution (`subprocess`, `sh`, `powershell`) is strictly forbidden.
