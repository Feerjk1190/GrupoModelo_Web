<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/autenticar_repartidor.php';
$idPedido = (int)($_GET['id_pedido'] ?? 0);
if ($idPedido <= 0) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Pedido incorrecto']);
    exit;
}
// No mostrar detalles de pedidos asignados a otro repartidor.
$ver = $conexion->prepare("SELECT id_pedido FROM pedidos WHERE id_pedido = ?
    AND (id_repartidor = ? OR (id_repartidor IS NULL AND estatus_pedido = 'Pendiente'))");
$ver->execute([$idPedido, $idRepartidorActual]);
if (!$ver->fetch()) {
    http_response_code(403);
    echo json_encode(['status'=>'error','message'=>'Pedido no disponible']);
    exit;
}
$sql = 'SELECT p.nombre, d.cantidad, d.precio_unitario, d.subtotal
        FROM detalles_pedidos d INNER JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_pedido = ?';
$consulta = $conexion->prepare($sql);
$consulta->execute([$idPedido]);
echo json_encode($consulta->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
