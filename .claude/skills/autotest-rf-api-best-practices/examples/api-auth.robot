*** Settings ***
# AOM Example — Authentication flow tests
# Demonstrates: login, logout, token refresh, role-based access, unauthorized access
#
# Run one TC:
#   Credentials: fill API_USERNAME / API_PASSWORD / API_ADMIN_USERNAME / API_ADMIN_PASSWORD in automation_test/.env, then check (prints SET/EMPTY only):
#   python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope project --keys API_USERNAME API_PASSWORD API_ADMIN_USERNAME API_ADMIN_PASSWORD
#   robot --loglevel TRACE -d results/ -t "User_Can_Login_With_Valid_Credentials" tests/auth.robot
#
Resource    ../config/imports.resource
Variables   ../data/auth.yaml

Suite Setup      Auth Test Suite - Setup
Suite Teardown   Delete All Sessions

*** Keywords ***
Auth Test Suite - Setup
    API - Create Session

*** Test Cases ***
User_Can_Login_With_Valid_Credentials
    [Tags]    auth    smoke    TC-001
    Auth - Login With Valid Credentials    ${data["${TEST_NAME}"]}

User_Cannot_Login_With_Wrong_Password
    [Tags]    auth    negative    TC-002
    Auth - Login Should Fail With Wrong Credentials    ${data["${TEST_NAME}"]}

User_Cannot_Login_With_Non_Existent_Account
    [Tags]    auth    negative    TC-003
    Auth - Login Should Fail With Wrong Credentials    ${data["${TEST_NAME}"]}

User_Cannot_Access_Protected_Resource_Without_Token
    [Tags]    auth    negative    TC-004
    Auth - Access Protected Resource Without Token

User_Cannot_Access_Protected_Resource_With_Invalid_Token
    [Tags]    auth    negative    TC-005
    Auth - Access Protected Resource With Invalid Token

Admin_Can_Access_Admin_Only_Endpoint
    [Tags]    auth    regression    TC-006
    Auth - Admin Access Succeeds    ${data["${TEST_NAME}"]}

Regular_User_Cannot_Access_Admin_Only_Endpoint
    [Tags]    auth    negative    TC-007
    Auth - Regular User Access To Admin Endpoint Should Fail    ${data["${TEST_NAME}"]}

User_Can_Logout_And_Token_Is_Invalidated
    [Tags]    auth    regression    TC-008
    Auth - Logout And Verify Token Invalidated    ${data["${TEST_NAME}"]}

--- api/auth/auth_variables.resource ---

*** Variables ***
${EP_LOGIN}             /auth/login
${EP_LOGOUT}            /auth/logout
${EP_REFRESH}           /auth/refresh
${EP_ME}                /api/v1/me
${EP_ADMIN_USERS}       /api/v1/admin/users

${FIELD_TOKEN}          access_token
${FIELD_REFRESH}        refresh_token
${FIELD_USER_ID}        user_id
${FIELD_ROLE}           role

--- api/auth/auth_keywords.resource ---

*** Settings ***
Resource    ../../config/imports.resource
Resource    auth_variables.resource

*** Keywords ***
Auth - Login With Valid Credentials
    [Arguments]    ${td}
    &{body}=    Create Dictionary    username=${API_USERNAME}    password=${API_PASSWORD}
    &{headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${response}=    API - POST    ${EP_LOGIN}    ${body}    ${headers}    expected_status=200
    API - Assert Field Not Empty    ${response}    ${FIELD_TOKEN}
    API - Assert Response Time    ${response}

Auth - Login Should Fail With Wrong Credentials
    [Arguments]    ${td}
    &{body}=    Create Dictionary    username=${td}[username]    password=${td}[password]
    &{headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${response}=    API - POST    ${EP_LOGIN}    ${body}    ${headers}    expected_status=${td}[expected_status]
    Dictionary Should Contain Key    ${response.json()}    error

Auth - Access Protected Resource Without Token
    &{headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${response}=    API - GET    ${EP_ME}    ${headers}    expected_status=401
    Dictionary Should Contain Key    ${response.json()}    error

Auth - Access Protected Resource With Invalid Token
    &{headers}=    Create Dictionary
    ...    Authorization=Bearer this_is_not_a_valid_jwt_token
    ...    Content-Type=${CONTENT_TYPE}
    ${response}=    API - GET    ${EP_ME}    ${headers}    expected_status=401
    Dictionary Should Contain Key    ${response.json()}    error

Auth - Admin Access Succeeds
    [Arguments]    ${td}
    &{body}=    Create Dictionary    username=${API_ADMIN_USERNAME}    password=${API_ADMIN_PASSWORD}
    &{login_headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${login}=    API - POST    ${EP_LOGIN}    ${body}    ${login_headers}    expected_status=200
    ${admin_token}=    Set Variable    ${login.json()}[${FIELD_TOKEN}]
    ${headers}=    API - Auth Header    ${admin_token}
    ${response}=    API - GET    ${EP_ADMIN_USERS}    ${headers}    expected_status=200
    API - Assert Field Not Empty    ${response}    data

Auth - Regular User Access To Admin Endpoint Should Fail
    [Arguments]    ${td}
    &{body}=    Create Dictionary    username=${API_USERNAME}    password=${API_PASSWORD}
    &{login_headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${login}=    API - POST    ${EP_LOGIN}    ${body}    ${login_headers}    expected_status=200
    ${user_token}=    Set Variable    ${login.json()}[${FIELD_TOKEN}]
    ${headers}=    API - Auth Header    ${user_token}
    ${response}=    API - GET    ${EP_ADMIN_USERS}    ${headers}    expected_status=403
    Dictionary Should Contain Key    ${response.json()}    error

Auth - Logout And Verify Token Invalidated
    [Arguments]    ${td}
    # Login
    &{body}=    Create Dictionary    username=${API_USERNAME}    password=${API_PASSWORD}
    &{login_headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE}
    ${login}=    API - POST    ${EP_LOGIN}    ${body}    ${login_headers}    expected_status=200
    ${token}=    Set Variable    ${login.json()}[${FIELD_TOKEN}]
    ${headers}=    API - Auth Header    ${token}
    # Verify token works
    API - GET    ${EP_ME}    ${headers}    expected_status=200
    # Logout
    API - POST    ${EP_LOGOUT}    ${EMPTY}    ${headers}    expected_status=200
    # Token should now be invalid
    API - GET    ${EP_ME}    ${headers}    expected_status=401

--- data/auth.yaml ---

data:
  User_Can_Login_With_Valid_Credentials:
    # Valid account = ${API_USERNAME} / ${API_PASSWORD} from automation_test/.env — never in YAML

  User_Cannot_Login_With_Wrong_Password:
    username: "testuser@example.com"
    password: "wrongpassword"
    expected_status: 401

  User_Cannot_Login_With_Non_Existent_Account:
    username: "nobody_here@example.com"
    password: "wrongpassword"
    expected_status: 401

  Admin_Can_Access_Admin_Only_Endpoint:
    # Admin = ${API_ADMIN_USERNAME} / ${API_ADMIN_PASSWORD} from automation_test/.env

  Regular_User_Cannot_Access_Admin_Only_Endpoint:
    # Regular user = ${API_USERNAME} / ${API_PASSWORD} from automation_test/.env

  User_Can_Logout_And_Token_Is_Invalidated:
    # ${API_USERNAME} / ${API_PASSWORD} from automation_test/.env
