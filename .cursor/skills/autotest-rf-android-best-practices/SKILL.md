---
name: autotest-rf-android-best-practices
description: Robot Framework Android (AppiumLibrary) test automation standards — locator strategy, FOM structure, common wrappers, wait strategies, gesture patterns, and anti-patterns. Use when writing, reviewing, or debugging RF Android tests.
user-invocable: false
---

# Robot Framework Android Test Automation Best Practices

> **Windows:** gọi `python` (hoặc `py -3`) thay cho `python3` — trên Windows `python3` thường trỏ tới bản giả của Microsoft Store. Claude Code trên Windows chạy lệnh qua Git Bash nên `&&`, `mkdir -p`, `/dev/null` vẫn dùng được; người dùng tự gõ trong PowerShell 5.1 thì tách từng lệnh (không `&&`, không `\` nối dòng).

## Overview

This document defines the testing standards, patterns, and best practices for writing E2E tests using Robot Framework with AppiumLibrary on Android. All agents and code reviewers MUST follow these guidelines. They supersede anything else if there is a conflict.

## When to Load Additional References

For deep troubleshooting or edge cases, read the relevant file in `.claude/skills/autotest-rf-android-best-practices/references/`:

| Situation | Reference file |
|---|---|
| Android locator strategies, UIAutomator2 queries | `locators.md` |
| Hardware buttons, activities, permissions, app state | `android-specific.md` |
| Swipe, scroll, long press, drag-and-drop | `gestures.md` |
| Appium server, device not found, element errors | `troubleshooting.md` |
| Capabilities, emulator vs real device setup | `capabilities.md` |
| MCloud device farm setup, UDID, parallel runs | `device-farm.md` |

Example files are in `.claude/skills/autotest-rf-android-best-practices/examples/`.

---

## 1. Project Test Setup

### Documentation & Commenting Standards

- **Max 1–2 sentences** per `[Documentation]` block. Focus on *why*, not *how*.
- **Inline comments**: only when the *why* is non-obvious. Under 10 words. No "click the button" comments.

### Config Reference

- **Test directory**: `./tests` — `.robot` suites only
- **Features directory**: `./features` — keywords & variables per feature
- **Common directory**: `./common` — shared wrappers and global variables
- **Config directory**: `./config` — `imports.resource` (libraries + keyword files only)
- **Data directory**: `./data` — YAML test data, one file per feature
- **Results directory**: `./results` — robot output (gitignored)
- **Appium server URL**: defined in `global-data.md` (default `http://127.0.0.1:4723`)
- **Device capabilities**: `appPackage`, `appActivity`, `deviceName`, `platformVersion` — stored in `common_variables.resource`, values sourced from `global-data.md`
- **Timeouts**: `${TIMEOUT_MIN}=5s`, `${TIMEOUT_DEFAULT}=15s`, `${TIMEOUT_MAX}=30s` — always larger than web, mobile UI is inherently slower
- **Screenshots**: `AppiumLibrary` captures automatically on any keyword failure via `run_on_failure=Capture Page Screenshot` (default). Do NOT add screenshot calls in `Test Teardown` or test steps — it creates duplicates.

### Naming Conventions

#### File Naming — `underscore_case` Only

All `.robot` and `.resource` files MUST use lowercase `underscore_case`.

| File type | Convention | Example |
|---|---|---|
| Test suite | `<feature>.robot` | `login.robot`, `transfer.robot` |
| Keyword resource | `<feature>_keywords.resource` | `login_keywords.resource` |
| Variables resource | `<feature>_variables.resource` | `login_variables.resource` |
| Common keywords | `common_keywords.resource` | `common_keywords.resource` |
| Common variables | `common_variables.resource` | `common_variables.resource` |
| Test data | `<feature>.yaml` | `login.yaml`, `transfer.yaml` |

#### Test Case Names
`Snake_Case_With_Capitalization` — e.g., `User_Can_Login_With_Valid_Credentials`

#### Keyword Names — `<Noun> - <Verb> <Object>`

The prefix MUST be a noun (module/feature name). Never a verb.

```
Login - Fill Credentials         ✅
Transfer - Select Source         ✅
Common - Click Element           ✅
Do Login - Fill Form             ❌  verb prefix
Handle Transfer - Select         ❌  verb prefix
```

The entire keyword name uses **spaces only** — never underscores in any part (prefix or action):

```
Product Listing Page By Category - Dismiss Welcome Modal   ✅  spaces throughout
Product Listing Page By Category - Dismiss_Welcome_Modal   ❌  underscore in action — wrong
Auth - Login_With_Credentials                              ❌  underscore in action — wrong
```

#### Variable Names — Type Prefix Required

| Prefix | Element type | Example |
|---|---|---|
| `btn_` | Button | `${btn_login}`, `${btn_confirm}` |
| `inp_` | Input / EditText | `${inp_amount}`, `${inp_username}` |
| `lbl_` | Label / TextView | `${lbl_balance}`, `${lbl_error}` |
| `txt_` | Expected text value | `${txt_success}`, `${txt_welcome}` |
| `icon_` | Icon / ImageView | `${icon_loading}`, `${icon_back}` |
| `sw_` | Switch / toggle | `${sw_notification}` |
| `tab_` | Tab | `${tab_transfer}`, `${tab_history}` |
| `menu_` | Menu item | `${menu_settings}` |

```robotframework
# Wrong
${confirm}    accessibility_id=confirm_button
${amount}     id=edt_amount

# Correct
${btn_confirm}    accessibility_id=confirm_button
${inp_amount}     id=edt_amount
```

### Formatting — `robotframework-tidy`

Always format `.robot` and `.resource` files after every write, before running, before committing.

```bash
pip install robotframework-tidy    # one-time install

python -m robotidy automation_test/features/login/
python -m robotidy automation_test/tests/login.robot
python -m robotidy automation_test/features/          # entire directory
```

---

## 2. Locator Strategy (Priority Order)

Always choose locators in this priority order. **Never guess or assume a locator works** — verify with `Get Source` or Appium Inspector before using.

### Priority 1: `id` (Resource ID) — Ưu tiên tuyệt đối

Maps to Android `resource-id`. Most uniquely identifying attribute — always prefer this when available.

```robotframework
# Full form (always unique — preferred)
${btn_confirm}    id=com.example.app:id/btn_confirm

# Short form (only if unique across the whole screen)
${btn_confirm}    id=btn_confirm
```

### Priority 2: `accessibility_id` (content-desc)

Maps to Android `content-desc`. Excellent cross-platform stability — works on both Android and iOS.

```robotframework
${btn_login}        accessibility_id=login_button
${inp_username}     accessibility_id=username_input
${lbl_balance}      accessibility_id=balance_label
```

Ask developers to add `contentDescription` attributes for stable test hooks.

### Priority 3: `android=` UIAutomator2 Selector

Smartest and most powerful fallback when `id` and `accessibility_id` are unavailable.

```robotframework
# By text (most common fallback)
${btn_login}     android=new UiSelector().text("Login")
${inp_search}    android=new UiSelector().resourceId("com.example:id/search_box")

# Combined — class + text for disambiguation
${btn_submit}    android=new UiSelector().className("android.widget.Button").text("Submit")

# Scrollable list — auto-scrolls to find element (POWERFUL)
${item_target}    android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("Settings"))
```

### Priority 4: `class` — Only When Element Is Unique on Screen

Maps to Android widget class name. Use only when the element is the **only** instance of its class on the current screen.

```robotframework
${inp_search}    class=android.widget.EditText
${lbl_title}     class=android.widget.TextView
```

If there are multiple elements of the same class → use `android=` UiSelector with index or text instead.

### Priority 5: `xpath` — Last Resort (Slow — Avoid)

XPath evaluation is significantly slower on Android than UiAutomator2. Use only when priorities 1–4 fail. Always relative paths (`//`).

```robotframework
# Acceptable — relative xpath with meaningful attributes
${btn_back}     xpath=//android.widget.ImageButton[@content-desc='Navigate up']
${lbl_total}    xpath=//android.widget.TextView[contains(@text,'Total')]

# NEVER — absolute xpath, breaks on any layout change
xpath=/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout[1]/...   # FORBIDDEN
```

### `contains(@text, ...)` / `contains(@content-desc, ...)` — Danger of Matching System Chrome

A broad `contains()` predicate can match an element that has **nothing to do with the screen you're testing** — most commonly the status bar (Wi-Fi/signal/battery icons), notification shade, or keyboard, which are present on almost every screen and often carry a `content-desc` containing common words like "Wifi", "Battery", "signal".

```robotframework
# DANGEROUS — also matches the always-present status bar Wi-Fi icon, not just real search results
${lbl_search_result_wifi}    xpath=//*[contains(@content-desc,'Wi-Fi') or contains(@text,'Wi-Fi')]

# BETTER — scope to the actual results list container
${lbl_search_result_wifi}    xpath=//*[@resource-id='com.google.android.settings.intelligence:id/list_results']//*[contains(@text,'Wi-Fi')]
```

A test that passes with this kind of locator **may be a false positive** — it confirms the XPath found *something*, not that it found the *right* thing. Before finalizing this kind of assertion, confirm in the live UI tree that the matched element actually sits inside the expected results/content container, not in a persistent system region (status bar, nav bar) that renders regardless of the action under test.

### Verify Locators Before Using

**Never hardcode a locator without verifying it exists in the view hierarchy — and that it uniquely identifies the intended element, not a decoy.**

```robotframework
# Dump view hierarchy to find correct locators
${source}=    Get Source
Log    ${source}    level=DEBUG
```

Use Appium Inspector on the live device/emulator for interactive inspection. If using RobotMCP (`.claude/skills/autotest-rf-mcp-assist/SKILL.md`), `get_session_state`/live inspection confirms the locator **resolves** — it does not confirm the resolved element is the *semantically correct* one. For any `contains()`-based locator, manually check the surrounding parent hierarchy for exactly this reason before trusting a live-session PASS.

If a locator is uncertain → mark it `# TODO: verify with Get Source or Appium Inspector`.

---

## 3. Assertion Patterns

### Element Visibility

```robotframework
Common - Wait For Element Visible    ${lbl_success}
Wait Until Element Is Not Visible    ${icon_loading}    timeout=${TIMEOUT_MAX}
Page Should Not Contain Element      ${lbl_error}
```

### Screen Transition (Replaces URL Assertions)

Verify screen change by waiting for a landmark element unique to the destination screen:

```robotframework
# After tapping "Transfer" tab — wait for the transfer screen's heading
Common - Wait For Element Visible    ${lbl_transfer_heading}

# After successful login — wait for home screen element
Common - Wait For Element Visible    ${lbl_home_welcome}
```

### Content Assertions

```robotframework
Element Text Should Be      ${lbl_status}       Success
Element Should Contain Text ${lbl_name}         ${expected_name}
Page Should Contain Text    ${txt_welcome}
Page Should Not Contain Text    ${txt_error_msg}
```

### Always Assert After Every Important Action

```robotframework
# Wrong — no assertion
Login - Tap Login Button

# Correct — verify the outcome
Login - Tap Login Button
Common - Wait For Element Visible    ${lbl_home_welcome}
```

---

## 4. Project Structure & Feature Object Model (FOM)

Same FOM principle as web — strict separation of locators and actions.

### Project Layout

```
automation_test/tests/                              # .robot test suites only
automation_test/features/
  login/
    login_keywords.resource
    login_variables.resource
  transfer/
    transfer_keywords.resource
    transfer_variables.resource
automation_test/common/
  common_keywords.resource          # 11 standard wrappers
  common_variables.resource         # timeouts + capability variables
automation_test/config/
  imports.resource                  # Libraries + keyword files only
automation_test/data/
  login.yaml
  transfer.yaml
automation_test/results/                            # gitignored
```

### File Size Limits

| File type | Limit | Action when exceeded |
|---|---|---|
| `*_keywords.resource` | ≤ 300 lines | Split by sub-feature |
| `*_variables.resource` | ≤ 150 lines | Move shared vars to `common_variables.resource` |
| `*.robot` | ≤ 200 lines | Split into separate files by scenario group |

### Centralized Imports

`automation_test/config/imports.resource` declares all libraries and keyword files. Test suites import only this file plus their YAML data.

```robotframework
# automation_test/config/imports.resource
*** Settings ***
Library     AppiumLibrary
Library     OperatingSystem
Library     Collections
Library     yaml
Library     String

Resource    ../common/common_keywords.resource
Resource    ../features/login/login_keywords.resource
Resource    ../features/transfer/transfer_keywords.resource
# Add a Resource line here whenever a new feature is created
```

Each keyword file imports `automation_test/config/imports.resource` (for libraries) and its own variables file:

```robotframework
# automation_test/features/login/login_keywords.resource
*** Settings ***
Resource    ../../config/imports.resource
Resource    login_variables.resource
```

Variable files (`_variables.resource`) have no imports — locators only.

### Feature Object Model (Strict Separation)

**Variables file — locators only, no imports:**

```robotframework
# automation_test/features/login/login_variables.resource
*** Variables ***
${inp_username}     accessibility_id=username_input
${inp_password}     accessibility_id=password_input
${btn_login}        id=com.example.app:id/btn_login
${lbl_home}         accessibility_id=home_screen_title
${txt_invalid}      Invalid username or password
```

**Keywords file — actions only, using Common wrappers:**

```robotframework
# automation_test/features/login/login_keywords.resource
*** Settings ***
Resource    ../../config/imports.resource
Resource    login_variables.resource

*** Keywords ***
Login - Open Screen
    Common - Open App
    Common - Handle Permission Dialog
    Common - Wait For Element Visible    ${inp_username}

Login - Fill Credentials
    [Arguments]    ${username}    ${password}
    Common - Input Text       ${inp_username}    ${username}
    Common - Input Text       ${inp_password}    ${password}

Login - Tap Login Button
    Common - Click Element    ${btn_login}
    Common - Wait For Element Visible    ${lbl_home}

Login - Verify Login Success
    Common - Wait For Element Visible    ${lbl_home}
    Page Should Contain Element    ${lbl_home}
```

### Keyword Size Limit — ≤ 20 Lines

If a keyword exceeds 20 lines, split into focused sub-keywords.

### The "Common" Boundary Rule

- `common_variables.resource` — ONLY global timeouts and capability variables. NEVER feature-specific locators.
- `common_keywords.resource` — ONLY the 11 standard wrappers. NEVER feature-specific flows.

### Unused Variable / Keyword / Argument Rule

Delete everything not referenced. If a variable, keyword, or argument is declared but never used, remove it.

### Strict DRY Principle

Zero duplication. Identical sequences → extract into a shared keyword.

### Two-Step Minimum Rule

Every custom keyword MUST contain at least two underlying keyword calls. No single-call wrappers.

---

## 5. Common Wrappers — 11 Standard Keywords

**NEVER** use raw AppiumLibrary keywords (`Click Element`, `Input Text`, etc.) directly inside feature keyword files. Always use the Common wrappers.

`common_keywords.resource` MUST contain these 11+ keywords:

```robotframework
# automation_test/common/common_keywords.resource
*** Settings ***
Resource    common_variables.resource

*** Keywords ***
Common - Open App
    [Arguments]    ${no_reset}=${NO_RESET}
    IF    '${EXECUTION_TARGET}' == 'local'
        Common - Open App Local    ${no_reset}
    ELSE IF    '${EXECUTION_TARGET}' == 'device_farm'
        Common - Open App Device Farm    ${no_reset}
    ELSE
        Fail    Unknown EXECUTION_TARGET: ${EXECUTION_TARGET}. Valid values: local | device_farm
    END

Common - Open App Local
    [Arguments]    ${no_reset}
    ${caps}=    Create Dictionary
    ...    platformName=Android
    ...    platformVersion=${PLATFORM_VERSION}
    ...    deviceName=${DEVICE_NAME}
    ...    automationName=UiAutomator2
    ...    appPackage=${APP_PACKAGE}
    ...    appActivity=${APP_ACTIVITY}
    ...    autoGrantPermissions=${TRUE}
    ...    noReset=${no_reset}
    ...    newCommandTimeout=300
    IF    '${DEVICE_UDID}' != '${EMPTY}'
        Set To Dictionary    ${caps}    udid=${DEVICE_UDID}
    END
    Open Application    ${APPIUM_URL}    &{caps}

Common - Open App Device Farm
    [Arguments]    ${no_reset}
    # ${FARM_USERNAME} / ${FARM_ACCESS_KEY} come from automation_test/.env via env_secrets.py
    ${farm_url}=    Set Variable    http://${FARM_USERNAME}:${FARM_ACCESS_KEY}@${FARM_HOST}${FARM_PATH}
    ${caps}=    Create Dictionary
    ...    platformName=Android
    ...    platformVersion=${PLATFORM_VERSION}
    ...    deviceName=${DEVICE_NAME}
    ...    automationName=UiAutomator2
    ...    appPackage=${APP_PACKAGE}
    ...    appActivity=${APP_ACTIVITY}
    ...    autoGrantPermissions=${TRUE}
    ...    noReset=${no_reset}
    ...    newCommandTimeout=300
    IF    '${DEVICE_UDID}' != '${EMPTY}'
        Set To Dictionary    ${caps}    udid=${DEVICE_UDID}
    END
    Open Application    ${farm_url}    &{caps}

Common - Close App
    Close Application

Common - Wait For Element Visible
    [Arguments]    ${locator}    ${timeout}=${TIMEOUT_DEFAULT}
    Wait Until Keyword Succeeds    3x    1s
    ...    Wait Until Element Is Visible    ${locator}    timeout=${timeout}

Common - Click Element
    [Arguments]    ${locator}    ${timeout}=${TIMEOUT_DEFAULT}
    Common - Wait For Element Visible    ${locator}    ${timeout}
    Click Element    ${locator}

Common - Input Text
    [Arguments]    ${locator}    ${text}    ${timeout}=${TIMEOUT_DEFAULT}
    Common - Wait For Element Visible    ${locator}    ${timeout}
    Clear Text    ${locator}
    Input Text    ${locator}    ${text}

Common - Click If Exists
    [Arguments]    ${locator}    ${timeout}=${TIMEOUT_MIN}
    ${visible}=    Run Keyword And Return Status
    ...    Wait Until Element Is Visible    ${locator}    timeout=${timeout}
    IF    ${visible}    Click Element    ${locator}

Common - Get Text
    [Arguments]    ${locator}    ${timeout}=${TIMEOUT_DEFAULT}
    Common - Wait For Element Visible    ${locator}    ${timeout}
    ${text}=    Get Text    ${locator}
    RETURN    ${text}

Common - Press Back
    Press Keycode    4

Common - Swipe Up To Element
    [Arguments]    ${locator}    ${max_swipes}=10    ${timeout}=${TIMEOUT_MIN}
    FOR    ${i}    IN RANGE    ${max_swipes}
        ${visible}=    Run Keyword And Return Status
        ...    Wait Until Element Is Visible    ${locator}    timeout=${timeout}
        IF    ${visible}    BREAK
        Swipe By Percent    50    80    50    20    1000
    END
    Wait Until Element Is Visible    ${locator}    timeout=${TIMEOUT_DEFAULT}

Common - Swipe Down To Element
    [Arguments]    ${locator}    ${max_swipes}=10    ${timeout}=${TIMEOUT_MIN}
    FOR    ${i}    IN RANGE    ${max_swipes}
        ${visible}=    Run Keyword And Return Status
        ...    Wait Until Element Is Visible    ${locator}    timeout=${timeout}
        IF    ${visible}    BREAK
        Swipe By Percent    50    20    50    80    1000
    END
    Wait Until Element Is Visible    ${locator}    timeout=${TIMEOUT_DEFAULT}

Common - Handle Permission Dialog
    ${present}=    Run Keyword And Return Status
    ...    Wait Until Page Contains Element
    ...    id=com.android.permissioncontroller:id/permission_allow_button    timeout=${TIMEOUT_MIN}
    IF    ${present}
        Click Element    id=com.android.permissioncontroller:id/permission_allow_button
    END
```

**Usage in feature keywords:**

```robotframework
# DO — use Common wrappers
Login - Fill Credentials
    [Arguments]    ${username}    ${password}
    Common - Input Text       ${inp_username}    ${username}
    Common - Input Text       ${inp_password}    ${password}
    Common - Click Element    ${btn_login}

# DON'T — raw AppiumLibrary bypasses retry and wait handling
Login - Fill Credentials
    Input Text      ${inp_username}    ${username}    # BAD
    Click Element   ${btn_login}                      # BAD
```

### Verify Keyword Exists Before Using (libdoc)

AppiumLibrary version installed on each user's machine can differ, and its keyword set/signatures (especially gesture keywords like `Swipe`, `Tap`, `Long Press`, `Swipe By Percent`) have changed across major versions. A keyword name or argument list recalled from memory may not match what is actually installed — this is the #1 cause of wasted debug time fixing wrong/non-existent keywords. Before writing **any** library keyword that is not already one of the standard wrappers above (new Common wrapper, or a raw call while debugging), verify it against the real installed library first — don't guess from memory:

**Use the correct interpreter — this is the part that silently breaks the check.** `libdoc` must run with the same Python interpreter that has `AppiumLibrary` installed for this project — never assume a bare `python`/`python3` on PATH is it. AppiumLibrary is commonly installed only under a specific pinned version (e.g. Python 3.9), while the machine's default `python3` may point at a completely different, newer interpreter that never had it installed. If run via `autotest-rf-android` (the agent skill), reuse the exact `PYTHON` path it already resolved in Step 0-env. Its failure message ("`Importing library 'AppiumLibrary' failed: ModuleNotFoundError`") looks like an environment error, not a "keyword doesn't exist" result — don't confuse the two. If checking standalone, confirm first: `<candidate> -c "import AppiumLibrary"` — only trust `list`/`show` output from an interpreter where that import succeeds.

```bash
# 1. Confirm the keyword exists (case/space-insensitive, supports * wildcard)
<python> -m robot.libdoc AppiumLibrary list "<approx keyword name>"

# 2. Confirm the exact argument signature before writing [Arguments] / call values
<python> -m robot.libdoc AppiumLibrary show "<Exact Keyword Name>"
```

- `list` returns nothing close to the expected name (and the interpreter used does import `AppiumLibrary` successfully) → the keyword does not exist on this installed version (renamed or removed). Do not guess a replacement — run `list` with a broader pattern (or no pattern) to see all candidates, then `show` the closest one to confirm before using it.
- `show` reveals a different signature than what you were about to write (renamed optional arg, different order/type, e.g. gesture keywords changing from percent-based to coordinate-based across versions) → write the call to match the real signature, not what training data suggests.
- Applies to any library the suite uses, not just AppiumLibrary — swap the library name (`Collections`, `String`, `DateTime`, `OperatingSystem`, `BuiltIn`, ...).
- Skip this for keywords already in use and passing in this project's `common_keywords.resource`/`_keywords.resource` — only required when introducing a keyword for the first time, or when debugging `No keyword with name` / argument-count errors.

---

## 6. Capability Variables

All device capabilities and execution target MUST be declared as variables in `common_variables.resource`. Never hardcode capability values or credentials.

```robotframework
# automation_test/common/common_variables.resource
*** Settings ***
Variables    ../python_lib/env_secrets.py    # credentials from automation_test/.env

*** Variables ***
${TIMEOUT_MIN}          5s
${TIMEOUT_DEFAULT}      15s
${TIMEOUT_MAX}          30s

# --- Execution target: local | device_farm ---
${EXECUTION_TARGET}     local

# --- Local device config ---
${APPIUM_URL}           http://127.0.0.1:4723
${DEVICE_NAME}          emulator-5554
${PLATFORM_VERSION}     13
${APP_PACKAGE}          com.example.app
${APP_ACTIVITY}         com.example.app.MainActivity
${NO_RESET}             ${TRUE}

# --- Shared (local + device farm) ---
${DEVICE_UDID}          ${EMPTY}    # Optional for local; required for device farm

# --- MCloud Device Farm config ---
${FARM_HOST}            10.207.247.201
${FARM_PATH}            /mcloud/wd/hub
# FARM_USERNAME / FARM_ACCESS_KEY → automation_test/.env (env_secrets.py) — never declare them here
```

Values come from the project's `global-data.md`. Switch execution target at runtime:

```bash
# Run on local device/emulator (default)
robot --loglevel TRACE -d automation_test/results/ automation_test/tests/<feature>.robot

# Run on MCloud device farm — fill FARM_USERNAME / FARM_ACCESS_KEY in automation_test/.env first:
python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope project --keys FARM_USERNAME FARM_ACCESS_KEY
robot --loglevel TRACE -d automation_test/results/ -v EXECUTION_TARGET:device_farm -v DEVICE_UDID:ABC123SERIAL automation_test/tests/<feature>.robot
```

```robotframework
# Wrong — hardcoded capabilities inline in keyword
Common - Open App
    Open Application    http://127.0.0.1:4723
    ...    deviceName=emulator-5554    # BAD

# Wrong — credentials declared in variable file (also overrides the .env value)
${FARM_USERNAME}    myuser    # NEVER DO THIS

# Correct — switch via ${EXECUTION_TARGET}, credentials from automation_test/.env
Common - Open App
    IF    '${EXECUTION_TARGET}' == 'local'
        Common - Open App Local    ${no_reset}
    ELSE IF    '${EXECUTION_TARGET}' == 'device_farm'
        Common - Open App Device Farm    ${no_reset}
    END
```

---

## 7. Timeout Variable Rule

**Never hardcode timeout values directly in keyword calls.**

```robotframework
# Wrong
Wait Until Element Is Visible    ${btn_login}    timeout=15s

# Correct
Wait Until Element Is Visible    ${btn_login}    timeout=${TIMEOUT_DEFAULT}
```

| Variable | Value | When to use |
|---|---|---|
| `${TIMEOUT_MIN}` | 5s | Optional elements, quick permission checks |
| `${TIMEOUT_DEFAULT}` | 15s | Standard elements (default) |
| `${TIMEOUT_MAX}` | 30s | Slow screens, loading states, heavy operations |

---

## 8. Locator and Text Variable Rule

**Never hardcode locators or text strings inline in keyword calls.**

```robotframework
# Wrong — hardcoded inline
Click Element            accessibility_id=login_button
Wait Until Page Contains    Welcome

# Correct — declared as variables
*** Variables ***
${btn_login}      accessibility_id=login_button
${txt_welcome}    Welcome

*** Keywords ***
Login - Tap Login
    Common - Click Element               ${btn_login}
    Common - Wait For Element Visible    ${txt_welcome}
```

---

## 9. Screenshot Rule

AppiumLibrary's `run_on_failure=Capture Page Screenshot` captures a screenshot the moment any keyword fails. No code needed. Do NOT add `Capture Page Screenshot` to `Test Teardown`.

```robotframework
# Correct — teardown only closes app; run_on_failure handles screenshots
Test Teardown    Common - Close App

# Wrong — redundant with run_on_failure
Test Teardown    Run Keywords
...    Run Keyword If Test Failed    Capture Page Screenshot    # REMOVE THIS
...    AND    Common - Close App
```

Screenshots land in `automation_test/results/` as `appium-screenshot-N.png`. The AI can read these PNG files directly for failure diagnosis.

---

## 10. Coordinate Click Rule

**Avoid clicking by absolute coordinates.** Priority:

1. **Locator-based** (always preferred) — `accessibility_id`, `id`, `android=`, `xpath`
2. **Element center tap** — calculate center from `Get Element Location` + `Get Element Size` when `Click Element` fails due to obscured element
3. **Percentage-based** — when no locator exists; use `Get Window Width` / `Get Window Height`
4. **Absolute x/y** — last resort only; MUST add a comment explaining why

```robotframework
# Best — locator-based
Common - Click Element    ${btn_confirm}

# Acceptable workaround when Click Element fails on obscured element
${location}=    Get Element Location    ${btn_confirm}
${size}=        Get Element Size    ${btn_confirm}
${x}=    Evaluate    ${location['x']} + ${size['width']} / 2
${y}=    Evaluate    ${location['y']} + ${size['height']} / 2
Tap With Positions    ${1}    ${x}    ${y}

# Last resort — absolute (must add comment)
Tap With Positions    ${1}    540    1200
```

---

## 11. Wait Strategies

### DO: Common wrappers (already include retry)

```robotframework
Common - Click Element               ${btn_submit}
Common - Wait For Element Visible    ${lbl_success}
Wait Until Element Is Not Visible    ${icon_loading}    timeout=${TIMEOUT_MAX}
```

### DO: `Wait Until Keyword Succeeds` for extra retry on flaky elements

```robotframework
# For elements behind animations or loading states
Wait Until Keyword Succeeds    5x    2s
...    Element Text Should Be    ${lbl_status}    Completed
```

### DO: UIAutomator2 scrollable for list items (Android-specific)

```robotframework
# Auto-scrolls within the list to find element — most reliable for RecyclerView
${item}    android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${item_name}"))
Wait Until Page Contains Element    ${item}
```

### DO: `Common - Swipe Up To Element` for off-screen elements

```robotframework
Common - Swipe Up To Element    ${btn_confirm}    max_swipes=15
```

### DON'T: Use `Sleep`

```robotframework
Sleep    5s    # BAD — flaky, wastes time
```

**Exception**: when no element or event can be waited on, and always add a comment explaining why.

### DON'T: Override global timeout

```robotframework
Set Appium Timeout    10s    # BAD — use per-keyword timeout= param instead
```

---

## 12. Test Case Standards

### App Lifecycle — Per Test (Not Per Suite)

Each test case opens a fresh app session in `Test Setup` and closes it in `Test Teardown`. Full isolation — no shared state.

```robotframework
*** Settings ***
Resource     ../config/imports.resource
Variables    ../data/login.yaml

Test Setup      Login - Open Screen
Test Teardown   Common - Close App

*** Test Cases ***
User_Can_Login_With_Valid_Credentials
    [Tags]    login    smoke    TC-001
    Login - Login With Valid Credentials
```

Feature keyword called from `Test Setup` always uses `Common - Open App`:

```robotframework
Login - Open Screen
    Common - Open App
    Common - Handle Permission Dialog
    Common - Wait For Element Visible    ${inp_username}
```

| Hook | Runs | Purpose |
|---|---|---|
| `Suite Setup` | Once before all tests | Non-app only: load YAML, prepare API state |
| `Suite Teardown` | Once after all tests | Non-app cleanup; omit if nothing to do |
| `Test Setup` | Before each test | Open fresh app session + navigate to feature screen |
| `Test Teardown` | After each test | Close app (`run_on_failure` handles screenshots) |

### Tags — Required on Every Test Case

```robotframework
*** Test Cases ***
User_Can_Login_With_Valid_Credentials
    [Tags]    login    smoke    TC-001
    Login - Login With Valid Credentials
```

| Tag | Purpose |
|---|---|
| `smoke` | Critical path — run on every build |
| `regression` | Full regression suite |
| `<feature>` | Feature name: `login`, `transfer` |
| `known-bug` | Known app bug — test will fail at expected step |

### One Keyword Per Test Case

```robotframework
*** Test Cases ***
User_Can_Login_With_Valid_Credentials
    [Tags]    login    smoke
    Login - Login With Valid Credentials

User_Cannot_Login_With_Wrong_Password
    [Tags]    login    regression
    Login - Login With Wrong Password    ${data["${TEST_NAME}"]}
```

### Tests Must Be Self-Contained

Never rely on state left by a previous test.

### Control Flow Belongs in Keywords

```robotframework
# Wrong — IF in test case
User_Can_Select_Tab
    IF    ${tab} == 'transfer'    Transfer - Click Tab

# Correct — moved to keyword
User_Can_Select_Tab
    Transfer - Select Tab    ${tab}
```

---

## 13. YAML Test Data

Same pattern as web FOM — one file per feature, top-level key `data:`.

```yaml
# automation_test/data/login.yaml
data:
  # User_Can_Login_With_Valid_Credentials: no entry — valid account = ${APP_USERNAME} / ${APP_PASSWORD} (automation_test/.env)
  User_Cannot_Login_With_Wrong_Password:
    password: "wrongpass"    # intentionally wrong — the only password allowed in YAML
    expected_error: "Invalid username or password"
```

```robotframework
# Valid-account scenario keyword takes no data — account comes from env_secrets.py
Login - Login With Valid Credentials
    Login - Fill Credentials    ${APP_USERNAME}    ${APP_PASSWORD}
    Login - Verify Login Success
```

**Rules:**
- Top-level key MUST be `data:`
- Child keys must match test case names exactly
- Never store real passwords/tokens in YAML — put them in `automation_test/.env` and reference `${APP_USERNAME}` / `${APP_PASSWORD}`; YAML only holds intentionally invalid values for negative TCs

---

## 14. Advanced Patterns

### Long Press (Context Menu, Hold Action)

```robotframework
# Long press to open context menu (AppiumLibrary v3.x)
Tap    ${lbl_list_item}    duration=0:00:02

# Wait for context menu to appear
Common - Wait For Element Visible    ${menu_delete}
Common - Click Element    ${menu_delete}
```

### Hardware Back Button

```robotframework
Common - Press Back    # wraps Press Keycode 4
```

### RecyclerView / Long List Navigation

```robotframework
# UIAutomator2 auto-scroll — most reliable for long lists
Common - Click Element    android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${item_name}"))

# Horizontal carousel swipe
Swipe By Percent    80    50    20    50    500    # swipe left → next item
Swipe By Percent    20    50    80    50    500    # swipe right → previous item
```

### `Run Keyword And Return Status` vs `Run Keyword And Ignore Error`

| | `Run Keyword And Return Status` | `Run Keyword And Ignore Error` |
|---|---|---|
| Returns | `${True}` / `${False}` | Tuple: `('PASS'/'FAIL', value)` |
| Use when | You need to branch on pass/fail | Step is optional, outcome irrelevant |

```robotframework
# Branch on result
${present}=    Run Keyword And Return Status
...    Wait Until Element Is Visible    ${btn_skip}    timeout=${TIMEOUT_MIN}
IF    ${present}    Common - Click Element    ${btn_skip}

# Optional step — just skip if missing
Run Keyword And Ignore Error    Common - Click If Exists    ${btn_skip_tutorial}
```

### Debugging — Dump View Hierarchy

```robotframework
${source}=    Get Source
Log    ${source}    level=DEBUG
Create File    ${OUTPUT_DIR}/screen_source.xml    ${source}
```

---

## 15. Environment & Dynamic Data

**Never hardcode credentials or environment-specific values.** Credentials come from `automation_test/.env` (`${APP_USERNAME}`, `${FARM_ACCESS_KEY}`... via `env_secrets.py`); other environment values from `global-data.md`.

```robotframework
*** Keywords ***
Login - Generate Unique Username
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    RETURN    testuser_${timestamp}@example.com
```

---

## 16. Device Farm (MCloud)

The project uses an internal MCloud device farm at `http://10.207.247.201/mcloud/wd/hub`.

**URL pattern**: `http://${FARM_USERNAME}:${FARM_ACCESS_KEY}@${FARM_HOST}${FARM_PATH}`

Credentials live in `automation_test/.env` (gitignored, filled by the user) and are loaded as `${FARM_USERNAME}` / `${FARM_ACCESS_KEY}` via `automation_test/python_lib/env_secrets.py` (see `autotest-credentials`). Never ask for or print their values. Before running, verify the keys are set:
```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope project --keys FARM_USERNAME FARM_ACCESS_KEY
```
A real environment variable with the same name overrides `.env` (e.g., CI secrets).

Switch via CLI variable — no code changes needed:
```bash
robot --loglevel TRACE -d automation_test/results/ -v EXECUTION_TARGET:device_farm -v DEVICE_UDID:<udid_from_mcloud_ui> automation_test/tests/<feature>.robot
```

For deep setup guidance, UDID lookup, and parallel execution, read `references/device-farm.md`.

---

## 17. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Writing a library keyword call from memory without checking `libdoc` first | Keyword may not exist or have different arguments on the installed version → wasted debug cycles | Run `libdoc AppiumLibrary list/show` first, with the correct interpreter (section 5, "Verify Keyword Exists Before Using") |
| Running `libdoc` with a bare `python`/`python3` instead of the project's resolved interpreter | Wrong interpreter may lack the library (AppiumLibrary is often pinned to a specific Python version) → `ModuleNotFoundError` misread as "keyword doesn't exist" | Reuse the exact `PYTHON` path resolved in Step 0-env (section 5) |
| Raw AppiumLibrary in feature keywords | Bypasses retry/wait | Use `Common - Click Element` / `Common - Input Text` |
| `Sleep 5s` | Flaky, wastes time | Use `Common - Wait For Element Visible` |
| Absolute XPath `/hierarchy/android...` | Breaks on any layout change | Use `accessibility_id` or relative `xpath` |
| Hardcoded locator inline in steps | Hard to maintain | Declare as `*** Variables ***` |
| Hardcoded timeout value (e.g., `timeout=15s`) | Inconsistent waits | Use `${TIMEOUT_DEFAULT}` etc. |
| Hardcoded capabilities inline in `Open Application` | Hard to maintain | Declare all caps in `common_variables.resource` |
| Credentials (`FARM_USERNAME`, `FARM_ACCESS_KEY`) hardcoded in any file | Security risk + leaks in git | Keep values in `automation_test/.env`; reference `${FARM_USERNAME}` / `${FARM_ACCESS_KEY}` loaded via `env_secrets.py` |
| Using `EXECUTION_TARGET=device_farm` without `DEVICE_UDID` | Session may open wrong device | Always specify UDID for device farm runs |
| Clicking by absolute coordinates | Breaks across device resolutions | Use locator-based click first |
| `Screenshot` after every action | Slow, noisy | Only on failure via `run_on_failure` |
| Shared app state between tests | Order-dependent failures | Each test opens and closes app independently |
| Feature keyword imports only `automation_test/config/imports.resource` without variables file | Missing locators | Import `automation_test/config/imports.resource` + own `_variables.resource` |
| Thin 1-line keyword wrappers | Zero value | Two-step minimum rule |
| No `[Tags]` on test cases | Can't filter in CI | Tag every test case |
| No assertion after action | Test always passes, proves nothing | Always assert the outcome |
| Unused variables / keywords / arguments | Dead code | Delete what is not used |
| Hardcoded test data in test steps | Breaks across environments | Use YAML data files |
| CSS locators | Not supported on native Android | Use `accessibility_id`, `id`, `android=`, `xpath` |
| `link=` or `partial link=` | Web-only, not supported on native Android | Use `accessibility_id` or `android=UiSelector().text()` |
| `Set Appium Timeout` globally | Overrides centralized config | Use per-keyword `timeout=` param |
| `FOR`/`IF` directly in test cases | Logic belongs in keywords | Move control flow to feature keyword |