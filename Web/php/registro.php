
<?php

header("Content-Type: application/json; charset=utf-8");

function responder($mensaje, $exito = false, $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ]);

    exit;
}

// Aceptar únicamente solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder("Método no permitido.", false, 405);
}

require_once __DIR__ . "/conexion.php";

// Recibir los datos del formulario
$nombre = trim($_POST["nombre"] ?? "");
$apellidos = trim($_POST["apellidos"] ?? "");
$correo = trim($_POST["correo"] ?? "");
$contrasena = $_POST["contrasena"] ?? "";
$confirmar = $_POST["confirmarContrasena"] ?? "";

// Validar campos
if (
    $nombre === "" ||
    $apellidos === "" ||
    $correo === "" ||
    $contrasena === "" ||
    $confirmar === ""
) {
    responder("Completa todos los campos.", false, 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder("Ingresa un correo electrónico válido.", false, 400);
}

if (strlen($contrasena) < 8) {
    responder("La contraseña debe tener al menos 8 caracteres.", false, 400);
}

if (strlen($contrasena) > 72) {
    responder("La contraseña es demasiado larga.", false, 400);
}

if ($contrasena !== $confirmar) {
    responder("Las contraseñas no coinciden.", false, 400);
}

$nombreCompleto = trim($nombre . " " . $apellidos);

if (mb_strlen($nombreCompleto, "UTF-8") > 100 ||
    strlen($correo) > 100) {
    responder("El nombre o correo es demasiado largo.", false, 400);
}

try {

    // Proteger la contraseña
    $hash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Guardar al usuario en MySQL
    $sql = "INSERT INTO usuarios
            (nombre_completo, correo, password, rol, contrasena_hash)
            VALUES
            (:nombre, :correo, NULL, :rol, :hash)";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        ":nombre" => $nombreCompleto,
        ":correo" => $correo,
        ":rol" => "Cliente",
        ":hash" => $hash
    ]);

    responder(
        "¡Cuenta creada correctamente! Ya puedes iniciar sesión.",
        true,
        201
    );

} catch (PDOException $error) {

    if ($error->getCode() === "23000") {
        responder("Este correo ya está registrado.", false, 409);
    }

    error_log($error->getMessage());

    responder("Error al registrar al usuario.", false, 500);
}
