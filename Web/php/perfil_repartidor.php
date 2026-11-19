
<?php

// DATOS DE LA CUENTA DEL REPARTIDOR

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "autenticar_repartidor.php";

// Enviar los datos del empleado autenticado
echo json_encode([
    "status" => "success",
    "repartidor" => $repartidorActual
], JSON_UNESCAPED_UNICODE);

?>
