<?php

// Hanya frontend yang terdaftar di FRONTEND_URL (pisahkan dengan koma) yang boleh memanggil API dari browser.
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://klinik-sehat-phi.vercel.app', 'http://localhost:5173'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
