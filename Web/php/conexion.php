<?php

// Conexión a la base de datos velora_db

$servidor = "127.0.0.1";
$baseDatos = "velora_db";
$usuario = "root";
$contrasena = "";

try {

    $conexion = new PDO(
        "mysql:host=$servidor;dbname=$baseDatos;charset=utf8mb4",
        $usuario,
        $contrasena
    );

    $conexion->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $conexion->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);
    exit("Error al conectar con la base de datos.");

}
