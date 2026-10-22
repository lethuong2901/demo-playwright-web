---
name: autotest-rf-api-best-practices
description: Robot Framework REST API testing standards — API Object Model (AOM), RequestsLibrary wrappers, authentication patterns, response validation, error case testing, YAML data-driven patterns, and anti-patterns. Use when writing, reviewing, or debugging RF API tests.
user-invocable: false
---

# Robot Framework REST API Test Automation Best Practices

> **Windows:** gọi `python` (hoặc `py -3`) thay cho `python3` — trên Windows `python3` thường trỏ tới bản giả của Microsoft Store. Claude Code trên Windows chạy lệnh qua Git Bash nên `&&`, `mkdir -p`, `/dev/null` vẫn dùng được; người dùng tự gõ trong PowerShell 5.1 thì tách từng lệnh (không `&&`, không `\` nối dòng).

## Overview

This document defines the testing standards, patterns, and best practices for writing REST API tests using Robot Framework with RequestsLibrary. All agents and code reviewers MUST follow these guidelines. They supersede anything else if there is a conflict.

## When to Load Additional References

For deep troubleshooting or edge cases, read the relevant file in `.claude/skills/autotest-rf-api-best-practices/references/`:

| Situation | Reference file |
|---|---|
| Full HTTP method options, session vs sessionless | `http-methods.md` |
| Bearer token, Basic Auth, OAuth, API key patterns | `authentication.md` |
| JSON validation, status codes, headers, response time | `response-validation.md` |
| YAML data-driven patterns, dynamic data, chained tests | `data-driven.md` |
| Connection errors, auth failures, JSON parse errors | `troubleshooting.md` |

Example files are in `.claude/skills/autotest-rf-api-best-practices/examples/`.

---

## 1. Project Setup

### Config Reference

- **Test directory**: `./tests` — `.robot` suites only
- **API feature directory**: `./api` — keyword and variable files per API module
- **Common directory**: `./common` — shared wrappers and global variables
- **Config directory**: `./config` — `imports.resource` (libraries + keyword files only)
- **Data directory**: `./data` — YAML test data, one file per feature
- **Results directory**: `./results` — robot output (gitignored)
- **Base URL**: in `common_variables.resource`, value sourced from `global-data.md`
- **Credentials**: NEVER in code — `API_USERNAME`, `API_PASSWORD` live in `automation_test/.env` (gitignored, user fills in), loaded as RF variables via `automation_test/python_lib/env_secrets.py` (see `autotest-credentials`)
- **Timeouts**: `${TIMEOUT}=30` (HTTP request), `${TIMEOUT_RESPONSE}=2` (max acceptable response seconds)

### Naming Conventions

#### File Naming — `underscore_case` Only

| File type | Convention | Example |
|---|---|---|
| Test suite | `<feature>.robot` | `user.robot`, `order.robot` |
| API keyword resource | `<feature>_keywords.resource` | `user_keywords.resource` |
| API variable resource | `<feature>_variables.resource` | `user_variables.resource` |
| Common keywords | `common_keywords.resource` | `common_keywords.resource` |
| Common variables | `common_variables.resource` | `common_variables.resource` |
| Test data | `<feature>.yaml` | `user.yaml`, `order.yaml` |

#### Test Case Names
`Snake_Case_With_Capitalization` — e.g., `User_Can_Create_Account_With_Valid_Data`

#### Keyword Names — `<Resource> - <Verb> <Object>`

The prefix is the API resource/module name. Never a verb.

```
User - Create Account             ✅
Order - Get By ID                 ✅
Auth - Login And Get Token        ✅
API - GET                         ✅  (Common wrapper)
Create User - POST                ❌  verb prefix
HandleOrder - Get                 ❌  verb prefix
```

The entire keyword name uses **spaces only** — never underscores in any part (prefix or action):

```
Product Listing Page By Category - Dismiss Welcome Modal   ✅  spaces throughout
Product Listing Page By Category - Dismiss_Welcome_Modal   ❌  underscore in action — wrong
Auth - Login_With_Credentials                              ❌  underscore in action — wrong
```

#### Variable Names — Prefix by Purpose

| Prefix | Purpose | Example |
|---|---|---|
| `${EP_}` | Endpoint path | `${EP_USER_LIST}`, `${EP_ORDER_BY_ID}` |
| `${FIELD_}` | JSON response field name | `${FIELD_USER_ID}`, `${FIELD_STATUS}` |
| `${VAL_}` | Expected value constant | `${VAL_STATUS_ACTIVE}`, `${VAL_ROLE_ADMIN}` |
| `${HDR_}` | Header name | `${HDR_CONTENT_TYPE}` |

### Formatting

Always format `.robot` and `.resource` files after every write, before running, before committing:

```bash
python -m robotidy automation_test/api/<feature>/
python -m robotidy automation_test/tests/<feature>.robot
```

---

## 2. API Object Model (AOM) — Strict Separation

AOM is the API equivalent of FOM. Separate endpoint paths from business logic.

### Project Layout

```
automation_test/tests/
  user.robot
  order.robot
automation_test/api/
  user/
    user_keywords.resource          # Business-level API calls: User - Create, User - Get Profile
    user_variables.resource         # Endpoint paths, field names, expected values
  order/
    order_keywords.resource
    order_variables.resource
automation_test/common/
  common_keywords.resource          # API - GET, POST, PUT, PATCH, DELETE, Login, Auth Header,
                                    # Assert Field Equals, Assert Field Not Empty, Assert Response Time
  common_variables.resource         # BASE_URL, TIMEOUT, TIMEOUT_RESPONSE, EP_LOGIN, ENV
automation_test/config/
  imports.resource                  # Libraries + keyword files only
automation_test/data/
  user.yaml
  order.yaml
automation_test/results/                            # gitignored
```

### Variables File — Endpoints and Constants Only

```robotframework
# automation_test/api/user/user_variables.resource
*** Variables ***
${EP_USER_LIST}         /api/v1/users
${EP_USER_BY_ID}        /api/v1/users
${EP_USER_CREATE}       /api/v1/users
${EP_USER_UPDATE}       /api/v1/users
${EP_USER_DELETE}       /api/v1/users

# JSON field names (for consistent assertions)
${FIELD_USER_ID}        id
${FIELD_USERNAME}       username
${FIELD_EMAIL}          email
${FIELD_STATUS}         status
${FIELD_ROLE}           role

# Expected values
${VAL_STATUS_ACTIVE}    active
${VAL_STATUS_INACTIVE}  inactive
${VAL_ROLE_ADMIN}       admin
${VAL_ROLE_USER}        user
```

No imports in variable files. No credentials. No hardcoded base URL.

### Keywords File — Business Keywords Using Common Wrappers

```robotframework
# automation_test/api/user/user_keywords.resource
*** Settings ***
Resource    ../../config/imports.resource
Resource    user_variables.resource

*** Keywords ***
User - Create Account
    [Arguments]    ${headers}    ${username}    ${email}    ${password}    ${role}=${VAL_ROLE_USER}
    &{body}=    Create Dictionary
    ...    username=${username}    email=${email}    password=${password}    role=${role}
    ${response}=    API - POST    ${EP_USER_CREATE}    ${body}    ${headers}    expected_status=201
    API - Assert Field Not Empty    ${response}    ${FIELD_USER_ID}
    API - Assert Response Time      ${response}
    RETURN    ${response}

User - Get By ID
    [Arguments]    ${headers}    ${user_id}
    ${response}=    API - GET    ${EP_USER_BY_ID}/${user_id}    ${headers}
    API - Assert Field Equals    ${response}    ${FIELD_USER_ID}    ${user_id}
    API - Assert Response Time    ${response}
    RETURN    ${response}

User - Update
    [Arguments]    ${headers}    ${user_id}    ${updates}
    ${response}=    API - PUT    ${EP_USER_UPDATE}/${user_id}    ${updates}    ${headers}
    API - Assert Field Equals    ${response}    ${FIELD_USER_ID}    ${user_id}
    RETURN    ${response}

User - Delete
    [Arguments]    ${headers}    ${user_id}
    ${response}=    API - DELETE    ${EP_USER_DELETE}/${user_id}    ${headers}
    RETURN    ${response}

User - Verify Is Active
    [Arguments]    ${response}
    ${json}=    Set Variable    ${response.json()}
    Should Be Equal    ${json}[${FIELD_STATUS}]    ${VAL_STATUS_ACTIVE}
```

### The AOM Boundary Rules

- `common_variables.resource` — ONLY global config: `${BASE_URL}`, `${TIMEOUT}`, `${EP_LOGIN}`. NEVER feature-specific endpoints.
- `common_keywords.resource` — ONLY HTTP method wrappers and shared utilities. NEVER feature-specific business logic.
- Variable files — endpoints and constants. NEVER business logic, NEVER credentials.
- Keyword files — business-level keywords. NEVER call `GET On Session`, `POST On Session` directly — use `API - GET`, `API - POST`.

---

## 3. Common Wrappers — HTTP Method Keywords

**NEVER** call `GET On Session`, `POST On Session`, etc. directly in feature keyword files. Always use the Common wrappers.

```robotframework
# automation_test/common/common_keywords.resource
*** Settings ***
Resource    common_variables.resource

*** Keywords ***
API - Create Session
    [Arguments]    ${alias}=${SUITE_NAME}
    Create Session    ${alias}    ${BASE_URL}    verify=${True}    timeout=${TIMEOUT}
    RETURN    ${alias}

API - Login
    [Arguments]    ${username}    ${password}    ${alias}=${SUITE_NAME}
    &{body}=    Create Dictionary    username=${username}    password=${password}
    ${response}=    POST On Session    ${alias}    ${EP_LOGIN}
    ...    json=${body}    expected_status=200
    RETURN    ${response.json()}[access_token]

API - Auth Header
    [Arguments]    ${token}
    &{headers}=    Create Dictionary
    ...    Authorization=Bearer ${token}
    ...    Content-Type=${CONTENT_TYPE}
    ...    Accept=application/json
    RETURN    ${headers}

API - GET
    [Arguments]    ${path}    ${headers}    ${expected_status}=200    ${params}=${NONE}    ${alias}=${SUITE_NAME}
    ${response}=    GET On Session    ${alias}    ${path}
    ...    headers=${headers}    params=${params}    expected_status=${expected_status}
    RETURN    ${response}

API - POST
    [Arguments]    ${path}    ${body}    ${headers}    ${expected_status}=201    ${alias}=${SUITE_NAME}
    ${response}=    POST On Session    ${alias}    ${path}
    ...    json=${body}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

API - PUT
    [Arguments]    ${path}    ${body}    ${headers}    ${expected_status}=200    ${alias}=${SUITE_NAME}
    ${response}=    PUT On Session    ${alias}    ${path}
    ...    json=${body}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

API - PATCH
    [Arguments]    ${path}    ${body}    ${headers}    ${expected_status}=200    ${alias}=${SUITE_NAME}
    ${response}=    PATCH On Session    ${alias}    ${path}
    ...    json=${body}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

API - DELETE
    [Arguments]    ${path}    ${headers}    ${expected_status}=204    ${alias}=${SUITE_NAME}
    ${response}=    DELETE On Session    ${alias}    ${path}
    ...    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

API - Assert Field Equals
    [Arguments]    ${response}    ${field}    ${expected}
    ${json}=    Set Variable    ${response.json()}
    Should Be Equal As Strings    ${json}[${field}]    ${expected}

API - Assert Field Not Empty
    [Arguments]    ${response}    ${field}
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    ${field}
    Should Not Be Empty    ${json}[${field}]

API - Assert Response Time
    [Arguments]    ${response}    ${max_seconds}=${TIMEOUT_RESPONSE}
    ${elapsed}=    Set Variable    ${response.elapsed.total_seconds()}
    Should Be True    ${elapsed} < ${max_seconds}
    ...    Response took ${elapsed}s, expected < ${max_seconds}s
```

### Verify Keyword Exists Before Using (libdoc)

RequestsLibrary version installed on each user's machine can differ, and its keyword set has changed across major versions (e.g. `Post Request`/`Get Request` still resolve on some installed versions but are marked `*DEPRECATED*` in favor of `POST On Session`/`GET On Session` — `show` prints the deprecation notice, so always read it, not just the Arguments line). A keyword name or argument list recalled from memory may not match what is actually installed — this is the #1 cause of wasted debug time fixing wrong/non-existent keywords. Before writing **any** library keyword that is not already one of the wrappers above (new Common wrapper, or a raw call while debugging), verify it against the real installed library first — don't guess from memory:

**Use the correct interpreter — this is the part that silently breaks the check.** `libdoc` must run with the same Python interpreter that has `RequestsLibrary` installed for this project — never assume a bare `python`/`python3` on PATH is it. If run via `autotest-rf-api` (the agent skill), reuse the exact `PYTHON` path it already resolved in Step 0-env. A different interpreter on the same machine can silently not have the library, and its failure message ("`Importing library 'X' failed: ModuleNotFoundError`") looks like an environment error, not a "keyword doesn't exist" result — don't confuse the two. If checking standalone, confirm first: `<candidate> -c "import RequestsLibrary"` — only trust `list`/`show` output from an interpreter where that import succeeds.

```bash
# 1. Confirm the keyword exists (case/space-insensitive, supports * wildcard)
<python> -m robot.libdoc RequestsLibrary list "<approx keyword name>"

# 2. Confirm the exact argument signature before writing [Arguments] / call values
<python> -m robot.libdoc RequestsLibrary show "<Exact Keyword Name>"
```

- `list` returns nothing close to the expected name (and the interpreter used does import `RequestsLibrary` successfully) → the keyword does not exist on this installed version (renamed or removed). Do not guess a replacement — run `list` with a broader pattern (or no pattern) to see all candidates, then `show` the closest one to confirm before using it.
- `show` reveals a different signature than what you were about to write (e.g. `data=` vs `json=`, missing `expected_status`) → write the call to match the real signature, not what training data suggests.
- **Verified caveat**: `POST On Session`/`GET On Session`/etc. are decorator-wrapped, so `show` prints their Arguments line as `[*args, **kwargs]` — no named params. The actual accepted parameters (`json=`, `data=`, `headers=`, `expected_status=`, ...) are only documented in the prose body below the Arguments line — read the full `show` output, not just the signature line, for these keywords.
- Applies to any library the suite uses, not just RequestsLibrary — swap the library name (`Collections`, `String`, `DateTime`, `OperatingSystem`, `BuiltIn`, ...).
- Skip this for keywords already in use and passing in this project's `common_keywords.resource`/`_keywords.resource` — only required when introducing a keyword for the first time, or when debugging `No keyword with name` / argument-count errors.

---

## 4. Common Variables

```robotframework
# automation_test/common/common_variables.resource
*** Settings ***
Variables    ../python_lib/env_secrets.py    # credentials from automation_test/.env

*** Variables ***
# --- Environment ---
${ENV}                  staging           # staging | production — override via -v ENV:production
${BASE_URL}             https://api-staging.example.com
${API_VERSION}          v1

# --- Timeouts ---
${TIMEOUT}              30                # HTTP request timeout (seconds)
${TIMEOUT_RESPONSE}     2                 # Max acceptable response time (seconds)

# --- Auth ---
${EP_LOGIN}             /auth/login       # Shared login endpoint
${CONTENT_TYPE}         application/json
# API_USERNAME / API_PASSWORD → automation_test/.env (env_secrets.py) — never redeclare here
```

Values come from `global-data.md`. Override environment at runtime:

```bash
# Default (staging)
robot --loglevel TRACE -d automation_test/results/ automation_test/tests/user.robot

# Production
robot --loglevel TRACE -d automation_test/results/ -v ENV:production -v BASE_URL:https://api.example.com automation_test/tests/user.robot
```

---

## 5. Authentication Rule

**NEVER hardcode credentials.** Credentials live in `automation_test/.env` (gitignored, filled in by the user) and reach RF as variables through `env_secrets.py` (imported in `common_variables.resource`). Use `${API_USERNAME}` / `${API_PASSWORD}` directly.

```robotframework
# In suite setup keyword — credentials are RF variables from automation_test/.env
<Feature> - Suite Setup
    API - Create Session
    ${token}=    API - Login    ${API_USERNAME}    ${API_PASSWORD}
    Set Suite Variable    ${SUITE_TOKEN}    ${token}
```

```bash
# Before running tests — Credential Gate: adds missing keys, prints HƯỚNG DẪN if any value is EMPTY (exit 2 → user fills automation_test/.env, don't run robot)
python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope project --keys API_USERNAME API_PASSWORD

robot --loglevel TRACE -d automation_test/results/ automation_test/tests/user.robot
```

Priority: environment variable > `automation_test/.env` > empty — CI can still inject secrets as env vars (override only). Never ask for credential values in chat, never read `.env`, never log credential values.

Auth header is passed explicitly to every feature keyword — not injected as magic global state.

```robotframework
*** Test Cases ***
User_Can_View_Profile
    [Tags]    user    smoke    TC-001
    ${headers}=    API - Auth Header    ${SUITE_TOKEN}
    User - Get Profile    ${headers}    ${data["${TEST_NAME}"]}
```

---

## 6. Request Rules

### Always Use `expected_status`

```robotframework
# Wrong — silent failure if status is wrong
${response}=    API - GET    ${EP_USER_BY_ID}/1    ${headers}

# Correct — fails immediately on wrong status
${response}=    API - GET    ${EP_USER_BY_ID}/1    ${headers}    expected_status=200
```

Common wrappers have `expected_status` as a parameter with sensible defaults:
- `API - GET` → default `200`
- `API - POST` → default `201`
- `API - PUT` / `API - PATCH` → default `200`
- `API - DELETE` → default `204`

For error case tests, pass the expected error status explicitly:
```robotframework
${response}=    API - POST    ${EP_USER_CREATE}    ${body}    ${headers}    expected_status=400
```

### Never Hardcode IDs or Environment-Specific Values

```robotframework
# Wrong — hardcoded ID
${response}=    API - GET    ${EP_USER_BY_ID}/42    ${headers}

# Correct — create first, use returned ID
${create}=    User - Create Account    ${headers}    ${td}[username]    ${td}[email]    ${td}[password]
${user_id}=    Set Variable    ${create.json()}[id]
${response}=    User - Get By ID    ${headers}    ${user_id}
```

### CRUD Chain Within One Test Case

Sequential create → read → update → delete belongs in a single test case, not in separate TCs. Each TC must be self-contained and not depend on another TC's output.

```robotframework
User_CRUD_Lifecycle
    [Tags]    user    regression    TC-010
    ${headers}=    API - Auth Header    ${SUITE_TOKEN}
    # Create
    ${created}=    User - Create Account    ${headers}    ${td}[username]    ${td}[email]    ${td}[password]
    ${user_id}=    Set Variable    ${created.json()}[id]
    # Read
    User - Get By ID    ${headers}    ${user_id}
    # Update
    &{updates}=    Create Dictionary    username=updated_name
    User - Update    ${headers}    ${user_id}    ${updates}
    # Delete
    User - Delete    ${headers}    ${user_id}
    # Verify deleted
    ${response}=    API - GET    ${EP_USER_BY_ID}/${user_id}    ${headers}    expected_status=404
```

---

## 7. Response Assertion Rules

### Always Assert After Every Request

Status code alone is not enough — always assert at least one response body field.

```robotframework
# Wrong — only status code, proves nothing about content
${response}=    API - POST    ${EP_USER_CREATE}    ${body}    ${headers}    expected_status=201

# Correct — status + at least one field
${response}=    API - POST    ${EP_USER_CREATE}    ${body}    ${headers}    expected_status=201
API - Assert Field Not Empty    ${response}    ${FIELD_USER_ID}
Should Be Equal    ${response.json()}[username]    ${td}[username]
```

### Assert Response Time on Critical Endpoints

```robotframework
API - Assert Response Time    ${response}    max_seconds=1
```

### Validate Error Response Structure

For 4xx/5xx tests, assert the error body too — not just the status code.

```robotframework
${response}=    API - POST    ${EP_USER_CREATE}    ${invalid_body}    ${headers}    expected_status=400
${json}=    Set Variable    ${response.json()}
Dictionary Should Contain Key    ${json}    error
Should Not Be Empty    ${json}[error]
```

---

## 8. Test Case Standards

### Suite-Level Session, Per-Test Auth Header

```robotframework
# automation_test/tests/user.robot
*** Settings ***
Resource     ../config/imports.resource
Variables    ../data/user.yaml

Suite Setup      User - Suite Setup
Suite Teardown   Delete All Sessions

*** Keywords ***
User - Suite Setup
    API - Create Session
    ${token}=    API - Login    ${API_USERNAME}    ${API_PASSWORD}
    Set Suite Variable    ${SUITE_TOKEN}    ${token}

*** Test Cases ***
User_Can_View_Own_Profile
    [Tags]    user    smoke    TC-001
    ${headers}=    API - Auth Header    ${SUITE_TOKEN}
    User - Get Profile    ${headers}
```

### Tags — Required on Every Test Case

| Tag | Purpose |
|---|---|
| `smoke` | Critical path — run on every build |
| `regression` | Full regression suite |
| `<feature>` | Feature name: `user`, `order`, `auth` |
| `negative` | Error case / invalid input tests |
| `known-bug` | Known API bug — test will fail at expected assertion |

### Tests Must Be Self-Contained

Never rely on state left by a previous test. Each test creates its own data.

### One Scenario Keyword Per Test Case

```robotframework
*** Test Cases ***
User_Can_Create_Account_With_Valid_Data
    [Tags]    user    smoke    TC-001
    ${headers}=    API - Auth Header    ${SUITE_TOKEN}
    User - Create Account With Valid Data    ${headers}    ${data["${TEST_NAME}"]}

User_Cannot_Create_Account_With_Duplicate_Email
    [Tags]    user    negative    TC-002
    ${headers}=    API - Auth Header    ${SUITE_TOKEN}
    User - Create Account With Duplicate Email    ${headers}    ${data["${TEST_NAME}"]}
```

### Control Flow Belongs in Keywords

```robotframework
# Wrong — IF in test case
User_Can_Create_Account
    IF    ${td}[role] == 'admin'    User - Create Admin

# Correct — moved to keyword
User_Can_Create_Account
    User - Create Account With Role    ${headers}    ${td}
```

---

## 9. YAML Test Data

Same pattern as web/mobile FOM — one file per API module, top-level key `data:`.

```yaml
# automation_test/data/user.yaml
data:
  User_Can_Create_Account_With_Valid_Data:
    username: "testuser_valid"
    email: "testuser@example.com"
    password: "<new-account-password>"       # password for the NEW account this test creates — not a login credential
    role: "user"

  User_Cannot_Create_Account_With_Duplicate_Email:
    username: "testuser_dup"
    email: "testuser@example.com"    # same email as above
    password: "<new-account-password>"
    expected_error: "Email already exists"

  User_Can_Update_Profile:
    new_username: "updated_name"
    new_email: "updated@example.com"
```

**Rules:**
- Top-level key MUST be `data:`
- Child keys must match test case names exactly
- Never store login credentials/tokens in YAML — valid accounts come from `${API_USERNAME}`/`${API_PASSWORD}` (`automation_test/.env`); YAML only holds intentionally wrong values for negative TCs (e.g. `wrong_password`) or data for accounts the test creates
- Use `expected_error`, `expected_status` keys for negative test data

---

## 10. Error Case Testing

Testing error responses is as important as testing success paths.

```robotframework
*** Keywords ***
User - Create Account With Duplicate Email
    [Arguments]    ${headers}    ${td}
    # First create a user with the email
    &{body}=    Create Dictionary    username=first_user    email=${td}[email]    password=${td}[password]
    API - POST    ${EP_USER_CREATE}    ${body}    ${headers}    expected_status=201
    # Try to create another with same email
    &{dup_body}=    Create Dictionary    username=${td}[username]    email=${td}[email]    password=${td}[password]
    ${response}=    API - POST    ${EP_USER_CREATE}    ${dup_body}    ${headers}    expected_status=409
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    error
    Should Contain    ${json}[error]    ${td}[expected_error]

Auth - Login With Wrong Password
    [Arguments]    ${headers}    ${td}
    &{body}=    Create Dictionary    username=${td}[username]    password=${td}[wrong_password]
    ${response}=    API - POST    ${EP_LOGIN}    ${body}    ${headers}    expected_status=401
    Dictionary Should Contain Key    ${response.json()}    error

Order - Get Non Existent Order
    [Arguments]    ${headers}
    ${response}=    API - GET    ${EP_ORDER_BY_ID}/99999999    ${headers}    expected_status=404
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    message
    Should Contain    ${json}[message]    not found
```

Common HTTP error codes to test:

| Status | When to test |
|---|---|
| 400 | Invalid request body, missing required fields, invalid format |
| 401 | Missing or invalid auth token |
| 403 | Valid auth but insufficient permissions |
| 404 | Resource not found (valid ID format but doesn't exist) |
| 409 | Conflict (duplicate email, unique constraint violation) |
| 422 | Validation errors (business rule violations) |

---

## 11. Keyword Size Limit — ≤ 20 Lines

If a keyword exceeds 20 lines, split into focused sub-keywords.

### File Size Limits

| File type | Limit | Action when exceeded |
|---|---|---|
| `*_keywords.resource` | ≤ 300 lines | Split by sub-feature |
| `*_variables.resource` | ≤ 150 lines | Move shared vars to `common_variables.resource` |
| `*.robot` | ≤ 200 lines | Split into separate files by scenario group |

### Two-Step Minimum Rule

Every custom keyword MUST contain at least two underlying keyword calls. No single-call wrappers.

### Unused Variable / Keyword / Argument Rule

Delete everything not referenced. If a variable, keyword, or argument is declared but never used, remove it.

---

## 12. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| No assertion after request | Test always passes, proves nothing | Assert `expected_status` + at least one body field |
| Hardcoded user IDs in URL | Breaks across environments | Create data first, use returned ID |
| `verify=${False}` in session | Security risk — no SSL check | Always `verify=${True}` |
| Credentials in code or YAML | Security risk | Keep in `automation_test/.env`, use `${API_USERNAME}`/`${API_PASSWORD}` in Suite Setup |
| Shared state between tests via suite variable mutations | Order-dependent failures | Each test creates its own data |
| `POST On Session` directly in feature keywords | Bypasses Common wrappers | Use `API - POST`, `API - GET` etc. |
| Writing a library keyword call from memory without checking `libdoc` first | Keyword may not exist or have different arguments on the installed version → wasted debug cycles | Run `libdoc RequestsLibrary list/show` first, with the correct interpreter (section 3, "Verify Keyword Exists Before Using") |
| Running `libdoc` with a bare `python`/`python3` instead of the project's resolved interpreter | Wrong interpreter may lack the library → `ModuleNotFoundError` misread as "keyword doesn't exist" | Reuse the exact `PYTHON` path resolved in Step 0-env (section 3) |
| Only checking status code | Misses response body bugs | Always assert at least one body field |
| Hardcoded base URL | Breaks env switching | Use `${BASE_URL}` from `common_variables.resource` |
| Single-call keyword wrappers | Zero value | Two-step minimum rule |
| No `[Tags]` on test cases | Can't filter in CI | Tag every test case |
| Missing `expected_status` in wrapper call | Silent wrong-status failures | Always specify `expected_status` |
| Hardcoded expected IDs from another env | Tests break across environments | Use dynamic data from API responses |
| FOR/IF directly in test cases | Logic belongs in keywords | Move control flow to feature keyword |
| Running full suite to check one endpoint | Slow feedback | Use `-t "Test_Case_Name"` to run single TC |
