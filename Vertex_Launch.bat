@echo off
set "ENGINE_PATH=Machina\verto-core"
set "PORT=5173"

echo [VERTEX] Initializing Fundamentum Core...
cd /d "%~dp0%ENGINE_PATH%"

:: Kill any existing process on our designated port
echo [VERTEX] Clearing Port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Check hardware modules
if not exist "node_modules\" (
    echo [VERTEX] Hardware modules missing. Running emergency initialization...
    call npm install
)

echo [VERTEX] Probing Local Substrate...
powershell -Command "$cpu = (Get-CimInstance Win32_Processor).Name; $ram = [Math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB); $gpu = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ' & '; $json = @{ cpu = $cpu; ram = $ram; gpu = $gpu } | ConvertTo-Json; Set-Content -Path 'public/sysinfo.json' -Value $json" || echo [VERTEX] WARNING: Substrate probe failed.

:: Start Vite on a fixed port
echo [VERTEX] Starting Fundamentum Engine on Port %PORT%...
:: Using a temporary file to signal ready state
if exist "ready.tmp" del ready.tmp
start /b cmd /c "npx vite --port %PORT% --strictPort > ready.tmp 2>&1"

echo [VERTEX] Stabilizing Nuntius Protocol...
:WAIT_LOOP
timeout /t 1 /nobreak >nul
netstat -ano | findstr :%PORT% | findstr LISTENING >nul
if errorlevel 1 (
    echo [VERTEX] Waiting for engine stability...
    goto WAIT_LOOP
)

:: Launch the interface
echo [VERTEX] Launching Visus...
start msedge --app=http://localhost:%PORT% || start http://localhost:%PORT%

echo [VERTEX] Machina Active. Entering Stealth Mode.
:: Using a hidden VBS to suppress the terminal
echo Set oShell = CreateObject("WScript.Shell") > hide.vbs
echo oShell.Run "powershell -Command ""Add-Type -Name W -Namespace C -MemberDefinition '[DllImport(\""user32.dll\"")]public static extern bool ShowWindow(IntPtr h,int n);[DllImport(\""kernel32.dll\"")]public static extern IntPtr GetConsoleWindow();'; [C.W]::ShowWindow([C.W]::GetConsoleWindow(),0)""", 0, False >> hide.vbs
wscript.exe hide.vbs
del hide.vbs

:: Monitoring loop: Keep hidden terminal alive until server dies
:MONITOR
timeout /t 5 /nobreak >nul
netstat -ano | findstr :%PORT% | findstr LISTENING >nul
if not errorlevel 1 goto MONITOR

:: Cleanup and Exit
if exist "ready.tmp" del ready.tmp
exit
