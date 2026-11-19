
// GRUPO MODELO
// DETALLE DEL PEDIDO

// Obtener ID del pedido
const parametros = new URLSearchParams(
    window.location.search
);

const idPedido = Number(parametros.get("id"));


// Obtener elementos del HTML
const numeroPedido = document.getElementById("numeroPedido");
const estadoPedido = document.getElementById("estadoPedido");

const productosPedido = document.getElementById("productosPedido");
const datosEntrega = document.getElementById("datosEntrega");
const datosRepartidor = document.getElementById("datosRepartidor");

const resumenPedido = document.getElementById("resumenPedido");
const totalPedido = document.getElementById("totalPedido");

const nuevoEstado = document.getElementById("nuevoEstado");
const guardarEstado = document.getElementById("guardarEstado");
const mensajeEstado = document.getElementById("mensajeEstado");

const cajaMotivo = document.getElementById("cajaMotivo");
const motivoCancelacion = document.getElementById("motivoCancelacion");
const motivoGuardado = document.getElementById("motivoGuardado");
const textoMotivo = document.getElementById("textoMotivo");

let estadoActual = "";
let guardando = false;


// =====================================
// 1. FORMATO DE PRECIO
// =====================================

function formatoPrecio(precio) {

    return Number(precio).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}


// =====================================
// 2. COLOR DEL ESTADO
// =====================================

function obtenerClaseEstado(estado) {

    switch (estado.toLowerCase()) {

        case "pendiente":
            return "estado-pendiente";

        case "en camino":
            return "estado-enviado";

        case "entregado":
            return "estado-entregado";

        case "cancelado":
            return "estado-cancelado";

        default:
            return "estado-otro";
    }
}


// =====================================
// 3. MOSTRAR UN DATO
// =====================================

function agregarDato(contenedor, titulo, valor) {

    const parrafo = document.createElement("p");

    parrafo.className = "detalle-dato";

    const etiqueta = document.createElement("strong");

    etiqueta.textContent = titulo + ": ";

    const texto = document.createElement("span");

    texto.textContent = valor || "No especificado";

    parrafo.append(etiqueta, texto);

    contenedor.appendChild(parrafo);
}


// =====================================
// 4. MOSTRAR MENSAJES
// =====================================

function mostrarMensaje(texto, tipo = "") {

    mensajeEstado.textContent = texto;

    mensajeEstado.className =
        "detalle-mensaje " + tipo;
}


// =====================================
// 5. MOSTRAR MOTIVO
// =====================================

function mostrarCampoMotivo() {

    if (
        estadoActual === "Pendiente" &&
        nuevoEstado.value === "Cancelado"
    ) {

        cajaMotivo.style.display = "block";

    } else {

        cajaMotivo.style.display = "none";
    }
}


// =====================================
// 6. PREPARAR SELECTOR DE ESTADO
// =====================================

function prepararEstado(pedido) {

    estadoActual = pedido.estatus_pedido;

    nuevoEstado.innerHTML = "";

    // Solo aparecen dos opciones
    const estados = ["Pendiente", "Cancelado"];

    estados.forEach(function(estado) {

        const opcion = document.createElement("option");

        opcion.value = estado;
        opcion.textContent = estado;

        nuevoEstado.appendChild(opcion);
    });

    motivoCancelacion.value = "";
    motivoGuardado.style.display = "none";

    // Solo modificar pedidos pendientes
    if (estadoActual === "Pendiente") {

        nuevoEstado.value = "Pendiente";

        nuevoEstado.disabled = false;
        guardarEstado.disabled = false;

        mostrarMensaje(
            "Puedes dejar el pedido pendiente o cancelarlo."
        );

    } else {

        nuevoEstado.disabled = true;
        guardarEstado.disabled = true;

        // Mostrar motivo si está cancelado
        if (estadoActual === "Cancelado") {

            nuevoEstado.value = "Cancelado";

            textoMotivo.textContent =
                pedido.motivo_cancelacion ||
                "No se registró un motivo";

            motivoGuardado.style.display = "block";

            mostrarMensaje(
                "Este pedido ya fue cancelado."
            );

        } else {

            mostrarMensaje(
                "El estado de este pedido se controla desde Android."
            );
        }
    }

    mostrarCampoMotivo();
}


// =====================================
// 7. MOSTRAR REPARTIDOR
// =====================================

function mostrarRepartidor(pedido) {

    // Limpiar la sección
    datosRepartidor.innerHTML = "";

    // Comprobar si tiene un repartidor
    if (pedido.nombre_repartidor) {

        agregarDato(
            datosRepartidor,
            "Nombre",
            pedido.nombre_repartidor
        );

        agregarDato(
            datosRepartidor,
            "Usuario",
            pedido.usuario_repartidor
        );

        agregarDato(
            datosRepartidor,
            "Grupo",
            pedido.grupo_repartidor
        );

        agregarDato(
            datosRepartidor,
            "Placa",
            pedido.placa_repartidor
        );

        agregarDato(
            datosRepartidor,
            "Teléfono",
            pedido.telefono_repartidor
        );

    } else {

        datosRepartidor.textContent =
            "Este pedido todavía no tiene repartidor asignado.";
    }
}


// =====================================
// 8. MOSTRAR TODOS LOS DATOS
// =====================================

function mostrarDetalle(pedido, productos) {

    numeroPedido.textContent =
        "Pedido #" + pedido.id_pedido;

    // Estado del pedido
    estadoPedido.textContent =
        pedido.estatus_pedido;

    estadoPedido.className =
        "detalle-estado " +
        obtenerClaseEstado(pedido.estatus_pedido);


    // Limpiar los datos anteriores
    productosPedido.innerHTML = "";
    datosEntrega.innerHTML = "";
    resumenPedido.innerHTML = "";


    // =================================
    // PRODUCTOS COMPRADOS
    // =================================

    productos.forEach(function(producto) {

        const fila = document.createElement("div");
        fila.className = "detalle-producto";

        // Imagen
        const imagen = document.createElement("img");

        imagen.src =
            "../img/" +
            encodeURIComponent(producto.imagen || "");

        imagen.alt = producto.nombre;


        // Información del producto
        const informacion = document.createElement("div");

        informacion.className =
            "detalle-producto-info";

        const nombre = document.createElement("strong");
        nombre.textContent = producto.nombre;

        const presentacion = document.createElement("p");
        presentacion.textContent =
            producto.presentacion || "";

        const cantidad = document.createElement("p");
        cantidad.textContent =
            "Cantidad: " + producto.cantidad;

        const precio = document.createElement("p");
        precio.textContent =
            "Precio unitario: " +
            formatoPrecio(producto.precio_unitario);

        informacion.append(
            nombre,
            presentacion,
            cantidad,
            precio
        );


        // Subtotal
        const subtotal = document.createElement("span");

        subtotal.className =
            "detalle-producto-precio";

        subtotal.textContent =
            formatoPrecio(producto.subtotal);

        fila.append(
            imagen,
            informacion,
            subtotal
        );

        productosPedido.appendChild(fila);
    });


    // =================================
    // RESUMEN DEL PEDIDO
    // =================================

    agregarDato(
        resumenPedido,
        "Cliente",
        pedido.cliente
    );

    agregarDato(
        resumenPedido,
        "Fecha",
        pedido.fecha_pedido
    );

    agregarDato(
        resumenPedido,
        "Teléfono",
        pedido.telefono
    );


    // =================================
    // DATOS DE ENTREGA
    // =================================

    agregarDato(
        datosEntrega,
        "Dirección",
        pedido.direccion
    );

    agregarDato(
        datosEntrega,
        "Código postal",
        pedido.codigo_postal
    );

    agregarDato(
        datosEntrega,
        "Referencias",
        pedido.referencias
    );


    // =================================
    // REPARTIDOR ASIGNADO
    // =================================

    mostrarRepartidor(pedido);


    // =================================
    // TOTAL
    // =================================

    totalPedido.textContent =
        formatoPrecio(pedido.total);
}


// =====================================
// 9. CONSULTAR PEDIDO EN PHP
// =====================================

async function cargarDetalle() {

    try {

        // Comprobar ID
        if (
            !Number.isInteger(idPedido) ||
            idPedido < 1
        ) {

            throw new Error(
                "Número de pedido incorrecto."
            );
        }

        // Solicitar datos a PHP
        const respuesta = await fetch(
            "../php/admin_detalle_pedido.php?id=" + idPedido,
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        // Comprobar sesión de administrador
        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {

            window.location.replace("login.html");

            return false;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || datos.exito !== true) {

            throw new Error(
                datos.mensaje ||
                "No se pudo consultar el pedido."
            );
        }

        // Mostrar información
        mostrarDetalle(
            datos.pedido,
            datos.productos
        );

        prepararEstado(datos.pedido);

        return true;

    } catch (error) {

        numeroPedido.textContent =
            "No se pudo mostrar el pedido";

        productosPedido.textContent =
            error.message;

        datosEntrega.textContent = "";

        datosRepartidor.textContent = "";

        resumenPedido.textContent = "";

        nuevoEstado.disabled = true;
        guardarEstado.disabled = true;

        mostrarMensaje(
            error.message,
            "error"
        );

        return false;

    } finally {

        document.body.classList.remove(
            "admin-oculto"
        );
    }
}


// =====================================
// 10. CANCELAR PEDIDO CON MOTIVO
// =====================================

async function guardarCambio() {

    // Evitar doble clic
    if (guardando) {
        return;
    }

    // Solo cancelar pendientes
    if (estadoActual !== "Pendiente") {
        return;
    }

    const estado = nuevoEstado.value;

    const motivo =
        motivoCancelacion.value.trim();

    // Si sigue pendiente, no hay cambios
    if (estado === "Pendiente") {

        mostrarMensaje(
            "El pedido ya está pendiente."
        );

        return;
    }

    // Comprobar estado
    if (estado !== "Cancelado") {

        mostrarMensaje(
            "Estado no permitido.",
            "error"
        );

        return;
    }

    // Motivo obligatorio
    if (motivo === "") {

        mostrarMensaje(
            "Escribe el motivo de cancelación.",
            "error"
        );

        motivoCancelacion.focus();

        return;
    }

    // Confirmar
    const confirmar = confirm(
        "¿Seguro que deseas cancelar este pedido?"
    );

    if (!confirmar) {
        return;
    }

    guardando = true;

    guardarEstado.disabled = true;
    nuevoEstado.disabled = true;

    mostrarMensaje(
        "Guardando cancelación..."
    );

    try {

        // Enviar datos a PHP
        const respuesta = await fetch(
            "../php/admin_cambiar_estado.php",
            {
                method: "POST",

                credentials: "same-origin",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id_pedido: idPedido,
                    estatus_pedido: "Cancelado",
                    motivo_cancelacion: motivo
                })
            }
        );

        // Comprobar sesión
        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {

            window.location.replace("login.html");

            return;
        }

        const resultado = await respuesta.json();

        if (
            !respuesta.ok ||
            resultado.exito !== true
        ) {

            throw new Error(
                resultado.mensaje ||
                "No se pudo cancelar el pedido."
            );
        }

        // Actualizar pantalla con los datos de MySQL
        const actualizado = await cargarDetalle();

        if (actualizado) {

            mostrarMensaje(
                "Pedido cancelado correctamente.",
                "exito"
            );
        }

    } catch (error) {

        mostrarMensaje(
            error.message,
            "error"
        );

        guardarEstado.disabled = false;
        nuevoEstado.disabled = false;

    } finally {

        guardando = false;
    }
}


// =====================================
// 11. EVENTOS
// =====================================

// Mostrar el campo del motivo
nuevoEstado.addEventListener(
    "change",
    mostrarCampoMotivo
);

// Guardar cancelación
guardarEstado.addEventListener(
    "click",
    guardarCambio
);

// Cargar pedido al abrir la página
cargarDetalle();
