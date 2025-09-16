<?php

require_once 'vendor/autoload.php';

use App\Models\ApiConnection;
use Illuminate\Foundation\Application;

// Bootstrap Laravel
$app = new Application(realpath(__DIR__));
$app->singleton(
    Illuminate\Contracts\Http\Kernel::class,
    App\Http\Kernel::class
);
$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);
$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Delete expired Gmail connection
$expiredConnection = ApiConnection::where('provider', 'gmail')->first();
if ($expiredConnection) {
    $expiredConnection->delete();
    echo "Deleted expired Gmail connection.\n";
}

echo "Please go to Settings page and reconnect Gmail to get fresh tokens.\n";
echo "Visit: http://127.0.0.1:8000/settings\n";