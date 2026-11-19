
<?php

// ADMINISTRACIÓN DE REPARTIDORES

require_once "verificar_admin.php";
require_once "conexion.php";

// Responder a JavaScript
function responder($exito, $mensaje, $codigo = 200) {

    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    // CONSULTAR REPARTIDORES
    if ($_SERVER["REQUEST_METHOD"] == "GET") {

        $sql = "SELECT
                    id_repartidor,
                    nombre,
                    usuario,
                    grupo,
                    placa_vehiculo,
                    telefono,
                    activo
                FROM repartidores
                ORDER BY id_repartidor DESC";

        $consulta = $conexion->query($sql);

        echo json_encode([
            "exito" => true,
            "repartidores" => $consulta->fetchAll(PDO::FETCH_ASSOC)
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] != "POST") {
        responder(false, "Método no permitido", 405);
    }

    // Recibir acción
    $accion = $_POST["accion"] ?? "";

    // ACTIVAR O DESACTIVAR
    if ($accion == "estado") {

        $id = (int)($_POST["id_repartidor"] ?? 0);
        $activo = $_POST["activo"] ?? "";

        if ($id <= 0 || ($activo != "0" && $activo != "1")) {
            responder(false, "Datos incorrectos", 400);
        }

        $sql = "UPDATE repartidores
                SET activo = ?
                WHERE id_repartidor = ?";

        $consulta = $conexion->prepare($sql);
        $consulta->execute([$activo, $id]);

        responder(true, "Estado del repartidor actualizado");
    }

    // GUARDAR O EDITAR
    if ($accion != "guardar") {
        responder(false, "Acción incorrecta", 400);
    }

    $id = (int)($_POST["id_repartidor"] ?? 0);
    $nombre = trim($_POST["nombre"] ?? "");
    $usuario = trim($_POST["usuario"] ?? "");
    $contrasena = $_POST["contrasena"] ?? "";
    $grupo = strtoupper(trim($_POST["grupo"] ?? ""));
    $placa = strtoupper(trim($_POST["placa_vehiculo"] ?? ""));
    $telefono = trim($_POST["telefono"] ?? "");

    // Comprobar campos
    if ($nombre == "" || $usuario == "" ||
        $grupo == "" || $placa == "" || $telefono == "") {

        responder(false, "Completa los datos del repartidor", 400);
    }

    // Comprobar tamaños
    if (strlen($nombre) > 100 ||
        strlen($usuario) > 50 ||
        strlen($grupo) > 10 ||
        strlen($placa) > 20 ||
        strlen($telefono) > 20) {

        responder(false, "Algún dato es demasiado largo", 400);
    }

    // Contraseña obligatoria al registrar
    if ($id == 0 && strlen($contrasena) < 8) {

        responder(
            false,
            "La contraseña debe tener al menos 8 caracteres",
            400
        );
    }

    // Validar contraseña si se quiere cambiar
    if ($contrasena != "" && strlen($contrasena) < 8) {

        responder(
            false,
            "La contraseña debe tener al menos 8 caracteres",
            400
        );
    }

    // Proteger contraseña
    if ($contrasena != "") {

        $contrasena = password_hash(
            $contrasena,
            PASSWORD_DEFAULT
        );
    }

    // NUEVO REPARTIDOR
    if ($id == 0) {

        $sql = "INSERT INTO repartidores
                (nombre, usuario, contrasena, grupo,
                 placa_vehiculo, telefono, activo)
                VALUES (?, ?, ?, ?, ?, ?, 1)";

        $consulta = $conexion->prepare($sql);

        $consulta->execute([
            $nombre,
            $usuario,
            $contrasena,
            $grupo,
            $placa,
            $telefono
        ]);

        responder(true, "Repartidor registrado correctamente");
    }

    // EDITAR SIN CAMBIAR CONTRASEÑA
    if ($contrasena == "") {

        $sql = "UPDATE repartidores
                SET nombre = ?,
                    usuario = ?,
                    grupo = ?,
                    placa_vehiculo = ?,
                    telefono = ?
                WHERE id_repartidor = ?";

        $valores = [
            $nombre,
            $usuario,
            $grupo,
            $placa,
            $telefono,
            $id
        ];

    } else {

        // EDITAR Y CAMBIAR CONTRASEÑA
        $sql = "UPDATE repartidores
                SET nombre = ?,
                    usuario = ?,
                    contrasena = ?,
                    grupo = ?,
                    placa_vehiculo = ?,
                    telefono = ?
                WHERE id_repartidor = ?";

        $valores = [
            $nombre,
            $usuario,
            $contrasena,
            $grupo,
            $placa,
            $telefono,
            $id
        ];
    }

    $consulta = $conexion->prepare($sql);
    $consulta->execute($valores);

    responder(true, "Datos del repartidor actualizados");

} catch (PDOException $error) {

    // Usuario duplicado
    if ($error->getCode() == "23000") {

        responder(
            false,
            "Ese usuario ya está registrado",
            409
        );
    }

    error_log($error->getMessage());

    responder(false, "Error al guardar repartidor", 500);
}

?>
