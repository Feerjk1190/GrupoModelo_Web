<?php

header("Content-Type: application/json; charset=utf-8");

function responder($mensaje, $exito = false, $codigo = 200, $rol = null) {

    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje,
        "rol" => $rol
    ]);

    exit;
}

// Solo permitir solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder("Metodo no permitido.", false, 405);
}

require_once __DIR__ . "/conexion.php";

// Recibir datos
$correo = trim($_POST["correo"] ?? "");
$contrasena = $_POST["contrasena"] ?? "";

// Validar campos
if ($correo === "" || $contrasena === "") {
    responder("Completa todos los campos.", false, 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder("Correo no valido.", false, 400);
}

try {

    // Buscar usuario
    $sql = "SELECT
                id_usuario,
                nombre_completo,
                correo,
                password,
                contrasena_hash,
                rol
            FROM usuarios
            WHERE correo = ?
            LIMIT 1";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$correo]);

    $usuario = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        responder("Correo o contraseña incorrectos.", false, 401);
    }

    // Comprobar contraseña
    $accesoCorrecto = false;
    $migrarPassword = false;

    // Caso 1: el usuario ya tiene contraseña con hash
    if (!empty($usuario["contrasena_hash"])) {

        $accesoCorrecto = password_verify(
            $contrasena,
            $usuario["contrasena_hash"]
        );

    } else {

        // Caso 2: todavía conserva contraseña antigua
        $passwordGuardado = $usuario["password"] ?? "";

        if ($passwordGuardado !== "") {

            $accesoCorrecto = hash_equals(
                $passwordGuardado,
                $contrasena
            );

            if ($accesoCorrecto) {
                $migrarPassword = true;
            }
        }
    }

    // Si la contraseña no coincide
    if (!$accesoCorrecto) {
        responder(
            "Correo o contraseña incorrectos.",
            false,
            401
        );
    }

    // Convertir automáticamente la contraseña antigua a hash
    if ($migrarPassword) {

        $nuevoHash = password_hash(
            $contrasena,
            PASSWORD_DEFAULT
        );

        $actualizar = $conexion->prepare(
            "UPDATE usuarios
             SET contrasena_hash = ?,
                 password = NULL
             WHERE id_usuario = ?"
        );

        $actualizar->execute([
            $nuevoHash,
            $usuario["id_usuario"]
        ]);
    }

    // Configurar sesión
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

    // Guardar información del usuario
    $_SESSION["id_usuario"] = (int) $usuario["id_usuario"];

    $_SESSION["nombre_usuario"] =
        $usuario["nombre_completo"];

    $_SESSION["rol"] = $usuario["rol"];

    // Respuesta exitosa
    responder(
        "Inicio de sesion exitoso.",
        true,
        200,
        $usuario["rol"]
    );

} catch (PDOException $error) {

    error_log($error->getMessage());

    responder(
        "Error al iniciar sesion.",
        false,
        500
    );
}

?>
