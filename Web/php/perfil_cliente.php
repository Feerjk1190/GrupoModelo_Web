<?php

// PERFIL DEL CLIENTE - GRUPO MODELO
// GET: consulta datos personales y dirección de entrega.
// POST: actualiza nombre y datos de entrega del usuario autenticado.

header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($exito, $mensaje, $perfil = null, $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje,
        "perfil" => $perfil
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (empty($_SESSION["id_usuario"])) {
    responder(false, "Debes iniciar sesión para consultar tu perfil.", null, 401);
}

if (($_SESSION["rol"] ?? "") !== "Cliente") {
    responder(false, "Esta sección está disponible para cuentas de cliente.", null, 403);
}

require_once __DIR__ . "/conexion.php";

$idUsuario = (int) $_SESSION["id_usuario"];
$metodo = $_SERVER["REQUEST_METHOD"];

try {

    if ($metodo === "GET") {

        $consulta = $conexion->prepare("
            SELECT
                u.id_usuario,
                u.nombre_completo,
                u.correo,
                u.rol,
                d.telefono,
                d.codigo_postal,
                d.direccion,
                d.referencias
            FROM usuarios u
            LEFT JOIN direcciones_entrega d
                ON d.id_usuario = u.id_usuario
            WHERE u.id_usuario = :id_usuario
            LIMIT 1
        ");

        $consulta->execute([
            ":id_usuario" => $idUsuario
        ]);

        $perfil = $consulta->fetch(PDO::FETCH_ASSOC);

        if (!$perfil) {
            responder(false, "No se encontró la cuenta del usuario.", null, 404);
        }

        responder(true, "Perfil consultado correctamente.", $perfil);
    }

    if ($metodo === "POST") {

        $datos = json_decode(file_get_contents("php://input"), true);

        if (!is_array($datos)) {
            responder(false, "Los datos recibidos no son válidos.", null, 400);
        }

        $nombre = trim($datos["nombre"] ?? "");
        $apellidos = trim($datos["apellidos"] ?? "");
        $telefono = trim($datos["telefono"] ?? "");
        $codigoPostal = trim($datos["codigo_postal"] ?? "");
        $direccion = trim($datos["direccion"] ?? "");
        $referencias = trim($datos["referencias"] ?? "");

        if ($nombre === "" || $apellidos === "" ||
            $telefono === "" || $codigoPostal === "" ||
            $direccion === "") {
            responder(false, "Completa todos los campos obligatorios.", null, 400);
        }

        $nombreCompleto = trim($nombre . " " . $apellidos);

        if (mb_strlen($nombreCompleto, "UTF-8") > 100 ||
            mb_strlen($direccion, "UTF-8") > 150 ||
            mb_strlen($referencias, "UTF-8") > 200) {
            responder(false, "Uno de los campos supera la longitud permitida.", null, 400);
        }

        if (!preg_match("/^[0-9]{10}$/", $telefono)) {
            responder(false, "El teléfono debe contener exactamente 10 dígitos.", null, 400);
        }

        if (!preg_match("/^[0-9]{5}$/", $codigoPostal)) {
            responder(false, "El código postal debe contener exactamente 5 dígitos.", null, 400);
        }

        $consultaUsuario = $conexion->prepare("
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = :id_usuario
              AND rol = 'Cliente'
            LIMIT 1
        ");

        $consultaUsuario->execute([
            ":id_usuario" => $idUsuario
        ]);

        if (!$consultaUsuario->fetch()) {
            responder(false, "No se encontró una cuenta de cliente válida.", null, 404);
        }

        $conexion->beginTransaction();

        $actualizarUsuario = $conexion->prepare("
            UPDATE usuarios
            SET nombre_completo = :nombre
            WHERE id_usuario = :id_usuario
        ");

        $actualizarUsuario->execute([
            ":nombre" => $nombreCompleto,
            ":id_usuario" => $idUsuario
        ]);

        // id_usuario tiene índice UNIQUE en direcciones_entrega,
        // por eso se actualiza la dirección existente o se inserta una nueva.
        $guardarDireccion = $conexion->prepare("
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

        $guardarDireccion->execute([
            ":id_usuario" => $idUsuario,
            ":nombre" => $nombreCompleto,
            ":telefono" => $telefono,
            ":codigo_postal" => $codigoPostal,
            ":direccion" => $direccion,
            ":referencias" => $referencias !== "" ? $referencias : "Sin referencias"
        ]);

        $conexion->commit();

        // Actualizar el nombre guardado en la sesión para reflejarlo en el saludo.
        $_SESSION["nombre_usuario"] = $nombreCompleto;

        responder(true, "Tus datos se guardaron correctamente.");

    }

    header("Allow: GET, POST");
    responder(false, "Método no permitido.", null, 405);

} catch (Throwable $error) {

    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log($error->getMessage());

    responder(false, "No fue posible procesar la información del perfil.", null, 500);
}
