@echo off
setlocal EnableExtensions EnableDelayedExpansion

title School Portal Setup

echo.
echo ========================================
echo        SCHOOL PORTAL SETUP
echo ========================================
echo.

REM ----------------------------------------
REM Check Node.js
REM ----------------------------------------
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js was not found.
    echo Install Node.js 20 or later and run setup again.
    pause
    exit /b 1
)

for /f "tokens=*" %%V in ('node --version') do set NODE_VERSION=%%V
echo Node.js: !NODE_VERSION!

REM ----------------------------------------
REM Check npm
REM ----------------------------------------
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Check curl
REM ----------------------------------------
where curl >nul 2>&1
if errorlevel 1 (
    echo ERROR: curl was not found.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Install project dependencies
REM ----------------------------------------
echo.
echo [1/10] Installing project dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Supabase CLI
REM ----------------------------------------
echo.
echo [2/10] Checking Supabase CLI...
call npx --yes supabase@2.116.0 --version
if errorlevel 1 (
    echo ERROR: Supabase CLI could not be started.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Supabase login
REM ----------------------------------------
echo.
echo [3/10] Supabase authentication...
call npx --yes supabase@2.116.0 login
if errorlevel 1 (
    echo ERROR: Supabase login failed.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Project reference
REM ----------------------------------------
echo.
echo ========================================
echo       SUPABASE PROJECT
echo ========================================
echo.
set /p PROJECT_REF=Enter your Supabase Project Reference ID:

if "!PROJECT_REF!"=="" (
    echo ERROR: Project Reference ID cannot be empty.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Link project
REM ----------------------------------------
echo.
echo [4/10] Linking Supabase project...
call npx --yes supabase@2.116.0 link --project-ref "!PROJECT_REF!"
if errorlevel 1 (
    echo ERROR: Supabase project linking failed.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Push database migrations
REM ----------------------------------------
echo.
echo [5/10] Applying database migrations...
call npx --yes supabase@2.116.0 db push
if errorlevel 1 (
    echo ERROR: Database migration failed.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Deploy Edge Functions
REM ----------------------------------------
echo.
echo [6/10] Deploying Edge Functions...

if not exist "supabase\functions\create-staff\index.ts" (
    echo ERROR: create-staff source was not found.
    pause
    exit /b 1
)

if not exist "supabase\functions\delete-user\index.ts" (
    echo ERROR: delete-user source was not found.
    pause
    exit /b 1
)

if not exist "supabase\functions\setup-admin\index.ts" (
    echo ERROR: setup-admin source was not found.
    pause
    exit /b 1
)

call npx --yes supabase@2.116.0 functions deploy create-staff --use-api
if errorlevel 1 (
    echo ERROR: create-staff deployment failed.
    pause
    exit /b 1
)

call npx --yes supabase@2.116.0 functions deploy delete-user --use-api
if errorlevel 1 (
    echo ERROR: delete-user deployment failed.
    pause
    exit /b 1
)

REM ----------------------------------------
REM Frontend configuration
REM ----------------------------------------
echo.
echo [7/10] Configuring frontend Supabase connection...
echo.

set "SUPABASE_URL="
set /p SUPABASE_URL=Enter your Supabase Project URL:

if "!SUPABASE_URL!"=="" (
    echo ERROR: Supabase URL cannot be empty.
    pause
    exit /b 1
)

set "SUPABASE_PUBLISHABLE_KEY="
set /p SUPABASE_PUBLISHABLE_KEY=Enter your Supabase Publishable Key:

if "!SUPABASE_PUBLISHABLE_KEY!"=="" (
    echo ERROR: Supabase Publishable Key cannot be empty.
    pause
    exit /b 1
)

if "!SUPABASE_URL:~-1!"=="/" set "SUPABASE_URL=!SUPABASE_URL:~0,-1!"

REM ----------------------------------------
REM Secure Admin bootstrap
REM ----------------------------------------
echo.
echo [8/10] Preparing secure Admin bootstrap...

for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "$b=New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Fill($b); [Convert]::ToBase64String($b)"`) do set "SETUP_ADMIN_TOKEN=%%T"

if "!SETUP_ADMIN_TOKEN!"=="" (
    echo ERROR: Could not generate a bootstrap token.
    pause
    exit /b 1
)

call npx --yes supabase@2.116.0 secrets set "SETUP_ADMIN_TOKEN=!SETUP_ADMIN_TOKEN!"
if errorlevel 1 (
    echo ERROR: Could not set SETUP_ADMIN_TOKEN.
    set "SETUP_ADMIN_TOKEN="
    pause
    exit /b 1
)

call npx --yes supabase@2.116.0 functions deploy setup-admin --use-api --no-verify-jwt
if errorlevel 1 (
    echo ERROR: setup-admin deployment failed.
    call npx --yes supabase@2.116.0 secrets unset SETUP_ADMIN_TOKEN >nul 2>&1
    set "SETUP_ADMIN_TOKEN="
    pause
    exit /b 1
)

REM ----------------------------------------
REM Collect Admin credentials
REM ----------------------------------------
echo.
echo ========================================
echo        INITIAL ADMINISTRATOR
echo ========================================
echo.

set "ADMIN_FULL_NAME="
set /p ADMIN_FULL_NAME=Admin Full Name:

if "!ADMIN_FULL_NAME!"=="" (
    echo ERROR: Admin full name cannot be empty.
    goto :CLEANUP_FAILURE
)

set "ADMIN_EMAIL="
set /p ADMIN_EMAIL=Admin Email:

if "!ADMIN_EMAIL!"=="" (
    echo ERROR: Admin email cannot be empty.
    goto :CLEANUP_FAILURE
)

REM ----------------------------------------
REM Password collection and API call happen
REM inside ONE PowerShell process. This fixes
REM the previous child-process environment bug.
REM ----------------------------------------
echo.
echo Enter the Admin password when prompted.
echo The password will not be displayed.
echo.

set "BOOTSTRAP_BODY=%TEMP%\school_portal_setup_admin_%RANDOM%.json"
set "BOOTSTRAP_RESPONSE=%TEMP%\school_portal_setup_admin_response_%RANDOM%.txt"
set "BOOTSTRAP_STATUS=%TEMP%\school_portal_setup_admin_status_%RANDOM%.txt"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$fullName=$env:ADMIN_FULL_NAME;" ^
  "$email=$env:ADMIN_EMAIL;" ^
  "$token=$env:SETUP_ADMIN_TOKEN;" ^
  "$url=$env:SUPABASE_URL;" ^
  "$key=$env:SUPABASE_PUBLISHABLE_KEY;" ^
  "$p1=Read-Host 'Admin Password' -AsSecureString;" ^
  "$p2=Read-Host 'Confirm Admin Password' -AsSecureString;" ^
  "$b1=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p1);" ^
  "$b2=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p2);" ^
  "try {" ^
  "  $password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b1);" ^
  "  $confirm=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b2);" ^
  "  if ([string]::IsNullOrEmpty($password)) { throw 'Admin password cannot be empty.' };" ^
  "  if ($password.Length -lt 8) { throw 'Admin password must be at least 8 characters.' };" ^
  "  if ($password -ne $confirm) { throw 'Passwords do not match.' };" ^
  "  $body=@{full_name=$fullName;email=$email;password=$password} | ConvertTo-Json -Compress;" ^
  "  [IO.File]::WriteAllText($env:BOOTSTRAP_BODY,$body,[Text.UTF8Encoding]::new($false));" ^
  "  $headers=@{'apikey'=$key;'Content-Type'='application/json';'x-setup-token'=$token};" ^
  "  $response=Invoke-WebRequest -Uri ($url + '/functions/v1/setup-admin') -Method Post -Headers $headers -Body ([IO.File]::ReadAllText($env:BOOTSTRAP_BODY)) -UseBasicParsing;" ^
  "  [IO.File]::WriteAllText($env:BOOTSTRAP_RESPONSE,$response.Content,[Text.UTF8Encoding]::new($false));" ^
  "  [IO.File]::WriteAllText($env:BOOTSTRAP_STATUS,[string][int]$response.StatusCode,[Text.UTF8Encoding]::new($false));" ^
  "} catch {" ^
  "  $status=0;" ^
  "  if ($_.Exception.Response) {" ^
  "    $status=[int]$_.Exception.Response.StatusCode;" ^
  "    try { $reader=New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); $content=$reader.ReadToEnd(); $reader.Dispose() } catch { $content=$_.Exception.Message }" ^
  "  } else { $content=$_.Exception.Message };" ^
  "  if ([string]::IsNullOrEmpty($content)) { $content=$_.Exception.Message };" ^
  "  [IO.File]::WriteAllText($env:BOOTSTRAP_RESPONSE,$content,[Text.UTF8Encoding]::new($false));" ^
  "  [IO.File]::WriteAllText($env:BOOTSTRAP_STATUS,[string]$status,[Text.UTF8Encoding]::new($false));" ^
  "  exit 1;" ^
  "} finally {" ^
  "  if ($b1 -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b1) };" ^
  "  if ($b2 -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b2) }" ^
  "}"

set "PS_RESULT=%ERRORLEVEL%"

if not exist "!BOOTSTRAP_STATUS!" (
    echo ERROR: Admin setup request did not return a status.
    goto :CLEANUP_FAILURE
)

set /p BOOTSTRAP_HTTP_STATUS=<"!BOOTSTRAP_STATUS!"

echo.
if "!BOOTSTRAP_HTTP_STATUS!"=="201" (
    echo ========================================
    echo      ADMIN CREATED SUCCESSFULLY
    echo ========================================
    echo.
    type "!BOOTSTRAP_RESPONSE!"
    echo.
) else (
    echo ========================================
    echo       ADMIN SETUP FAILED
    echo ========================================
    echo.
    if exist "!BOOTSTRAP_RESPONSE!" type "!BOOTSTRAP_RESPONSE!"
    echo.
    goto :CLEANUP_FAILURE
)

REM ----------------------------------------
REM Remove temporary bootstrap secret
REM ----------------------------------------
echo Removing temporary bootstrap secret...
call npx --yes supabase@2.116.0 secrets unset SETUP_ADMIN_TOKEN >nul 2>&1

if errorlevel 1 (
    echo WARNING: Could not remove SETUP_ADMIN_TOKEN automatically.
    echo Remove it manually from Supabase secrets immediately.
)

set "SETUP_ADMIN_TOKEN="

del /q "!BOOTSTRAP_BODY!" >nul 2>&1
del /q "!BOOTSTRAP_RESPONSE!" >nul 2>&1
del /q "!BOOTSTRAP_STATUS!" >nul 2>&1

REM ----------------------------------------
REM Update frontend configuration
REM ----------------------------------------
echo.
echo [10/10] Finalizing frontend configuration...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='js\supabase.js';" ^
  "if (-not (Test-Path $p)) { throw 'js\supabase.js was not found.' };" ^
  "$c=Get-Content $p -Raw;" ^
  "$url=$env:SUPABASE_URL;" ^
  "$key=$env:SUPABASE_PUBLISHABLE_KEY;" ^
  "$quote=[char]34;" ^
  "$c=[regex]::Replace($c,'(?m)^\s*(?:export\s+)?const\s+SUPABASE_URL\s*=\s*.*?;\s*$','const SUPABASE_URL = ' + $quote + $url + $quote + ';');" ^
  "$c=[regex]::Replace($c,'(?m)^\s*(?:export\s+)?const\s+SUPABASE_PUBLISHABLE_KEY\s*=\s*.*?;\s*$','const SUPABASE_PUBLISHABLE_KEY = ' + $quote + $key + $quote + ';');" ^
  "Set-Content -Path $p -Value $c -Encoding UTF8;" ^
  "$verify=Get-Content $p -Raw;" ^
  "if ($verify -notmatch [regex]::Escape($url)) { throw 'Supabase URL was not written to js\supabase.js.' };" ^
  "if ($verify -notmatch [regex]::Escape($key)) { throw 'Supabase Publishable Key was not written to js\supabase.js.' }"

if errorlevel 1 (
    echo ERROR: Could not update js\supabase.js.
    echo The setup has completed, but frontend configuration could not be verified.
    pause
    exit /b 1
)

echo Supabase URL and Publishable Key successfully written to js\supabase.js.
echo.
echo ========================================
echo          SETUP COMPLETE
echo ========================================
echo.
echo Database migrations have been applied.
echo Edge Functions have been deployed.
echo Initial Administrator has been created.
echo Temporary bootstrap secret has been removed.
echo Frontend Supabase configuration has been updated.
echo.
echo Start the portal with:
echo.
echo     node server.js
echo.
echo Then open:
echo.
echo     http://localhost:3000/login.html
echo.
echo ========================================
echo.
pause
endlocal
exit /b 0

:CLEANUP_FAILURE
echo.
echo Removing temporary bootstrap secret...
call npx --yes supabase@2.116.0 secrets unset SETUP_ADMIN_TOKEN >nul 2>&1
set "SETUP_ADMIN_TOKEN="
set "SCHOOL_PORTAL_ADMIN_PASSWORD="
set "SCHOOL_PORTAL_ADMIN_PASSWORD_CONFIRM="
if defined BOOTSTRAP_BODY del /q "!BOOTSTRAP_BODY!" >nul 2>&1
if defined BOOTSTRAP_RESPONSE del /q "!BOOTSTRAP_RESPONSE!" >nul 2>&1
if defined BOOTSTRAP_STATUS del /q "!BOOTSTRAP_STATUS!" >nul 2>&1
echo.
echo Setup stopped. The temporary bootstrap secret has been removed.
pause
exit /b 1
