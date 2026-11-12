
<?php

header("Content-Type: application/json; charset=utf-8");

ini_set("session.use_strict_mode", "1");
ini_set("session.use_only_cookies", "1");

session_start();

// Comprobar si existe un usuario autenticado
if (isset($_SESSION["id_usuario"])) {

    echo json_encode([
        "autenticado" => true,
        "usuario" => [
            "id" => $_SESSION["id_usuario"],
            "nombre" => $_SESSION["nombre_usuario"],
            "rol" => $_SESSION["rol"]
        ]
    ]);

} else {

    echo json_encode([
        "autenticado" => false,
        "usuario" => null
    ]);

}
