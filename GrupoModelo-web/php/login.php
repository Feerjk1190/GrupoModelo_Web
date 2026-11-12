
<?php

header("Content-Type: application/json; charset=utf-8");

// Responder en formato JSON
function responder($mensaje, $exito = false, $codigo = 200, $rol = null) {
    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje,
        "rol" => $rol
    ]);

    exit;
}

// Aceptar únicamente POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder("Método no permitido.", false, 405);
}

require_once __DIR__ . "/conexion.php";

// Obtener los datos enviados por JavaScript
$correo = trim($_POST["correo"] ?? "");
$contrasena = $_POST["contrasena"] ?? "";

// Validar los campos
if ($correo === "" || $contrasena === "") {
    responder("Completa todos los campos.", false, 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder("Ingresa un correo electrónico válido.", false, 400);
}

try {

    // Buscar usuario por correo
    $sql = "SELECT
                id_usuario,
                nombre_completo,
                correo,
                rol,
                contrasena_hash
            FROM usuarios
            WHERE correo = :correo
            LIMIT 1";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        ":correo" => $correo
    ]);

    $usuario = $consulta->fetch();

    // Comprobar usuario y contraseña
    if (
        !$usuario ||
        empty($usuario["contrasena_hash"]) ||
        !password_verify(
            $contrasena,
            $usuario["contrasena_hash"]
        )
    ) {
        responder(
            "Correo o contraseña incorrectos.",
            false,
            401
        );
    }

    // Crear una sesión segura
    ini_set("session.use_strict_mode", "1");
    ini_set("session.use_only_cookies", "1");

    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => !empty($_SERVER["HTTPS"])
            && $_SERVER["HTTPS"] !== "off",
        "httponly" => true,
        "samesite" => "Lax"
    ]);

    session_start();
    session_regenerate_id(true);

    // Guardar información del usuario en la sesión
    $_SESSION["id_usuario"] = (int) $usuario["id_usuario"];
    $_SESSION["nombre_usuario"] = $usuario["nombre_completo"];
    $_SESSION["rol"] = $usuario["rol"];

    responder("¡Inicio de sesión exitoso!", true, 200, $usuario["rol"]);

} catch (PDOException $error) {

    error_log($error->getMessage());

    responder(
        "Ocurrió un error al iniciar sesión.",
        false,
        500
    );

}
