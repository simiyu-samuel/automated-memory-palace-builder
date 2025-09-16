@echo off
echo Starting Memory Palace services...

echo Starting Laravel server...
start "Laravel Server" cmd /k "php artisan serve"

timeout /t 3

echo Starting MCP Server...
start "MCP Server" cmd /k "npm run mcp-server"

echo.
echo Services started!
echo Laravel: http://127.0.0.1:8000
echo Settings: http://127.0.0.1:8000/settings
echo.
echo Press any key to close this window...
pause > nul