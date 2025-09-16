<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-redirect', function() {
    return view('test-redirect');
});

Route::view('/test-direct-redirect', 'test-redirect');