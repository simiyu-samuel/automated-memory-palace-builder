<?php

use Illuminate\Support\Facades\Route;

Route::get('/debug-simple', function() {
    return view('debug-connection');
});

Route::view('/test-connection-form', 'debug-connection');