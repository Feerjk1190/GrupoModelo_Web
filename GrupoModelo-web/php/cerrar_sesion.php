
<?php

header("Content-Type: application/json; charset=utf-8");

// Cerrar sesión solamente mediante POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "exito" => false,
        "mensaje" => "Método no permitido."
    ]);
    exit;
}

ini_set("session.use_strict_mode", "1");
ini_set("session.use_only_cookies", "1");

session_start();

// Vaciar los datos del usuario
$_SESSION = [];

// Eliminar la cookie de sesión
if (ini_get("session.use_cookies")) {

    $parametros = session_get_cookie_params();

    setcookie(session_name(), "", [
        "expires" => time() - 3600,
        "path" => $parametros["path"],
        "domain" => $parametros["domain"],
        "secure" => $parametros["secure"],
        "httponly" => $parametros["httponly"],
        "samesite" => "Lax"
    ]);
}

// Destruir la sesión en el servidor
session_destroy();

echo json_encode([
    "exito" => true,
    "mensaje" => "Sesión cerrada correctamente."
]);
