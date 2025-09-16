@echo off
echo Fixing Memory Palace sync issues...

echo 1. Running database migration...
php artisan migrate --force

echo 2. Clearing caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear

echo 3. Installing MCP dependencies...
npm install

echo 4. Testing API endpoints...
php artisan route:list | findstr "sync"

echo.
echo Setup complete! Now you can:
echo 1. Start Laravel: php artisan serve
echo 2. Start MCP server: npm run mcp-server
echo 3. Test sync at: http://127.0.0.1:8000/settings
echo.
pause