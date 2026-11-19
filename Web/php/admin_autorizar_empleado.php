<?php
// Autorizar una cuenta institucional, solamente por un administrador.
// IMPORTANTE: verificar por fuera del sistema la identidad y propiedad del correo.
require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

function responder($exito, $mensaje, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode(["exito" => $exito, "mensaje" => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido.", 405);
}
// Rechazar solicitudes de otros orígenes para evitar cambios no autorizados.
$origen = $_SERVER["HTTP_ORIGIN"] ?? "";
$servidor = $_SERVER["HTTP_HOST"] ?? "";
if ($origen !== "") {
    $hostOrigen = parse_url($origen, PHP_URL_HOST);
    $hostActual = explode(":", $servidor)[0];
    if ($hostOrigen !== $hostActual) {
        responder(false, "Origen de solicitud no permitido.", 403);
    }
}
if (($_SERVER["HTTP_SEC_FETCH_SITE"] ?? "same-origin") === "cross-site") {
    responder(false, "Solicitud no permitida.", 403);
}

$datos = json_decode(file_get_contents("php://input"), true);
$id = filter_var($datos["id_usuario"] ?? null, FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    responder(false, "ID de usuario incorrecto.", 400);
}

try {
    $conexion->beginTransaction();
    $consulta = $conexion->prepare(
        "SELECT id_usuario, correo, rol FROM usuarios WHERE id_usuario = ? FOR UPDATE"
    );
    $consulta->execute([$id]);
    $usuario = $consulta->fetch(PDO::FETCH_ASSOC);
    if (!$usuario) {
        $conexion->rollBack();
        responder(false, "No se encontró al usuario.", 404);
    }
    if ($usuario["rol"] !== "Cliente") {
        $conexion->rollBack();
        responder(false, "La cuenta no es de cliente.", 400);
    }
    // Comprobar dominio completo, no solo que contenga la palabra 'modelo'.
    if (!preg_match('/^[^@\s]+@modelo\.com$/i', $usuario["correo"])) {
        $conexion->rollBack();
        responder(false, "Solo se pueden autorizar correos @modelo.com.", 400);
    }

    $actualizar = $conexion->prepare(
        "UPDATE usuarios SET rol = 'Administrador' WHERE id_usuario = ? AND rol = 'Cliente'"
    );
    $actualizar->execute([$id]);
    if ($actualizar->rowCount() !== 1) {
        throw new RuntimeException("No se pudo actualizar el rol.");
    }
    $conexion->commit();
    responder(true, "Cuenta autorizada. El empleado debe cerrar sesión y volver a entrar.");
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log($error->getMessage());
    responder(false, "No se pudo autorizar la cuenta.", 500);
}
