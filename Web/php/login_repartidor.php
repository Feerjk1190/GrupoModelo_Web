
<?php

// LOGIN DE REPARTIDORES - GRUPO MODELO

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "conexion.php";

// Solo aceptar POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Usa POST"
    ]);
    exit;
}

// Recibir usuario y contraseña
$usuario = trim($_POST["usuario"] ?? "");
$contrasena = $_POST["contrasena"] ?? "";

if ($usuario == "" || $contrasena == "") {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Completa los campos"
    ]);
    exit;
}

// Buscar al repartidor
$sql = "SELECT id_repartidor, usuario, contrasena, activo
        FROM repartidores
        WHERE usuario = ?
        LIMIT 1";

$consulta = $conexion->prepare($sql);
$consulta->execute([$usuario]);

$repartidor = $consulta->fetch(PDO::FETCH_ASSOC);

// Comprobar que exista y esté activo
$valido = false;

if ($repartidor && (int)$repartidor["activo"] == 1) {

    $guardada = (string)$repartidor["contrasena"];

    // Detectar si la contraseña está protegida
    $info = password_get_info($guardada);

    if ($info["algo"] !== null) {

        $valido = password_verify(
            $contrasena,
            $guardada
        );

    } else {

        // Compatibilidad temporal con cuentas de prueba
        $valido = hash_equals($guardada, $contrasena);

        if ($valido) {

            // Convertir la contraseña anterior a hash
            $nuevoHash = password_hash(
                $contrasena,
                PASSWORD_DEFAULT
            );

            $actualizar = $conexion->prepare(
                "UPDATE repartidores
                 SET contrasena = ?
                 WHERE id_repartidor = ?"
            );

            $actualizar->execute([
                $nuevoHash,
                $repartidor["id_repartidor"]
            ]);
        }
    }
}

if (!$valido) {

    http_response_code(401);

    echo json_encode([
        "status" => "error",
        "message" => "Usuario o contraseña incorrectos"
    ]);

    exit;
}

// Crear token de sesión
$token = bin2hex(random_bytes(32));
$hashToken = hash("sha256", $token);

// Guardar la sesión en MySQL
$sql = "INSERT INTO sesiones_repartidores
        (id_repartidor, token_hash, fecha_expiracion)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))";

$consulta = $conexion->prepare($sql);

$consulta->execute([
    $repartidor["id_repartidor"],
    $hashToken
]);

echo json_encode([
    "status" => "success",
    "token" => $token
], JSON_UNESCAPED_UNICODE);

?>
