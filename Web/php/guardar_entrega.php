<?php

// GUARDAR DATOS DE ENTREGA - GRUPO MODELO

header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($exito, $mensaje, $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Solo se permite POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    responder(false, "Método no permitido.", 405);
}

// Verificar que el cliente inició sesión
if (empty($_SESSION["id_usuario"])) {
    responder(false, "Debes iniciar sesión.", 401);
}

// Obtener datos enviados desde JavaScript
$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(false, "Los datos recibidos no son válidos.", 400);
}

$nombre = trim($datos["nombre"] ?? "");
$telefono = trim($datos["telefono"] ?? "");
$codigoPostal = trim($datos["codigo_postal"] ?? "");
$direccion = trim($datos["direccion"] ?? "");
$referencias = trim($datos["referencias"] ?? "");

if ($nombre === "" || $direccion === "") {
    responder(false, "Completa el nombre y la dirección.", 400);
}

if (mb_strlen($nombre) > 100 ||
    mb_strlen($direccion) > 150 ||
    mb_strlen($referencias) > 200) {
    responder(false, "Uno de los campos es demasiado largo.", 400);
}

if (!preg_match("/^[0-9]{10}$/", $telefono)) {
    responder(false, "El teléfono debe contener 10 dígitos.", 400);
}

if (!preg_match("/^[0-9]{5}$/", $codigoPostal)) {
    responder(false, "El código postal debe contener 5 dígitos.", 400);
}

require_once __DIR__ . "/conexion.php";

try {

    $consulta = $conexion->prepare("
        INSERT INTO direcciones_entrega (
            id_usuario,
            nombre,
            telefono,
            codigo_postal,
            direccion,
            referencias
        )
        VALUES (
            :id_usuario,
            :nombre,
            :telefono,
            :codigo_postal,
            :direccion,
            :referencias
        )
        ON DUPLICATE KEY UPDATE
            nombre = VALUES(nombre),
            telefono = VALUES(telefono),
            codigo_postal = VALUES(codigo_postal),
            direccion = VALUES(direccion),
            referencias = VALUES(referencias)
    ");

    $consulta->execute([
        ":id_usuario" => (int) $_SESSION["id_usuario"],
        ":nombre" => $nombre,
        ":telefono" => $telefono,
        ":codigo_postal" => $codigoPostal,
        ":direccion" => $direccion,
        ":referencias" => $referencias !== ""
            ? $referencias
            : "Sin referencias"
    ]);

    responder(true, "Datos de entrega guardados correctamente.");

} catch (Throwable $error) {

    error_log($error->getMessage());

    responder(
        false,
        "No fue posible guardar los datos de entrega.",
        500
    );
}
