
<?php

// ========================================
// ENVIAR MENSAJE - GRUPO MODELO WEB
// ========================================

header("Content-Type: application/json; charset=utf-8");

// Función para responder al navegador
function responder($exito, $mensaje, $codigo = 200) {

    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Permitir únicamente solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido.", 405);
}

// Obtener los datos enviados desde JavaScript
$entrada = json_decode(file_get_contents("php://input"), true);

if (!is_array($entrada)) {
    responder(false, "Los datos enviados no son válidos.", 400);
}

// Validar que los campos sean texto
$campos = ["nombre", "correo", "asunto", "mensaje"];

foreach ($campos as $campo) {

    if (
        !isset($entrada[$campo]) ||
        !is_string($entrada[$campo])
    ) {
        responder(false, "Completa los campos correctamente.", 400);
    }
}

// Limpiar espacios innecesarios
$nombre = trim($entrada["nombre"]);
$correo = trim($entrada["correo"]);
$asunto = trim($entrada["asunto"]);
$mensaje = trim($entrada["mensaje"]);

// Verificar campos obligatorios
if (
    $nombre === "" ||
    $correo === "" ||
    $asunto === "" ||
    $mensaje === ""
) {
    responder(false, "Completa todos los campos.", 400);
}

// Validar longitud de los campos
if (
    mb_strlen($nombre, "UTF-8") > 100 ||
    mb_strlen($correo, "UTF-8") > 150 ||
    mb_strlen($asunto, "UTF-8") > 100 ||
    mb_strlen($mensaje, "UTF-8") > 1000
) {
    responder(false, "Uno de los campos supera el límite permitido.", 400);
}

// Validar correo electrónico
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, "Ingresa un correo electrónico válido.", 400);
}

// Validar asunto permitido
$asuntosPermitidos = [
    "Información de productos",
    "Pedidos y distribución",
    "Atención al cliente",
    "Otro"
];

if (!in_array($asunto, $asuntosPermitidos, true)) {
    responder(false, "Selecciona un asunto válido.", 400);
}

// Conexión con MySQL
require_once __DIR__ . "/conexion.php";

try {

    // Insertar el mensaje en la base de datos
    $consulta = $conexion->prepare("
        INSERT INTO mensajes_contacto
            (nombre, correo, asunto, mensaje)
        VALUES
            (:nombre, :correo, :asunto, :mensaje)
    ");

    $consulta->execute([
        ":nombre" => $nombre,
        ":correo" => $correo,
        ":asunto" => $asunto,
        ":mensaje" => $mensaje
    ]);

    responder(true, "Mensaje enviado correctamente.");

} catch (PDOException $error) {

    error_log($error->getMessage());

    responder(
        false,
        "No se pudo guardar el mensaje. Intenta nuevamente.",
        500
    );
}
