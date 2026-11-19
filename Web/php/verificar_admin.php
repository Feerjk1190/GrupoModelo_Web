<?php

// Verificar que el usuario sea administrador

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json; charset=utf-8");

// Comprobar que exista una sesión
if (!isset($_SESSION["id_usuario"])) {

    http_response_code(401);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Debes iniciar sesión."
    ]);

    exit;
}

// Comprobar que tenga permiso de administrador
if (($_SESSION["rol"] ?? "") !== "Administrador") {

    http_response_code(403);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No tienes permisos de administrador."
    ]);

    exit;
}
