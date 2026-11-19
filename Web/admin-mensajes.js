
// ========================================
// MENSAJES DEL ADMINISTRADOR
// ========================================

// Elementos de las estadísticas
const totalPendientes = document.getElementById("totalPendientes");
const totalRespondidos = document.getElementById("totalRespondidos");
const totalMensajes = document.getElementById("totalMensajes");

// Buscador y filtro
const buscarMensaje = document.getElementById("buscarMensaje");
const filtrarEstadoMensaje = document.getElementById("filtrarEstadoMensaje");

// Bandeja de entrada
const listaMensajes = document.getElementById("listaMensajes");
const cantidadMostrada = document.getElementById("cantidadMostrada");

// Panel de detalles
const mensajeSinSeleccion = document.getElementById("mensajeSinSeleccion");
const mensajeDetalle = document.getElementById("mensajeDetalle");

const detalleAsunto = document.getElementById("detalleAsunto");
const detalleEstado = document.getElementById("detalleEstado");
const detalleNombre = document.getElementById("detalleNombre");
const detalleCorreo = document.getElementById("detalleCorreo");
const detalleFecha = document.getElementById("detalleFecha");
const detalleContenido = document.getElementById("detalleContenido");

// Botones
const btnMarcarRespondido = document.getElementById("btnMarcarRespondido");
const mensajeAccion = document.getElementById("mensajeAccion");
const adminCerrarSesion = document.getElementById("adminCerrarSesion");

// ARREGLO: mensajes recibidos desde MySQL
let mensajes = [];

// ID del mensaje seleccionado
let idMensajeSeleccionado = null;

// Evita guardar dos veces al mismo tiempo
let guardandoMensaje = false;


// ========================================
// 1. CONSULTAR LOS MENSAJES EN MYSQL
// ========================================

async function cargarMensajes() {

    try {

        const respuesta = await fetch("../php/admin_mensajes.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        // Comprobar los permisos
        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.replace("login.html");
            return false;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No se pudieron cargar los mensajes."
            );
        }

        // Guardar los mensajes en un arreglo
        mensajes = datos.mensajes;

        // Mostrar las estadísticas
        mostrarResumen(datos.resumen);

        // Actualizar la bandeja
        mostrarMensajes();

        // Si ya había un mensaje seleccionado, actualizar sus datos
        if (idMensajeSeleccionado !== null) {
            seleccionarMensaje(idMensajeSeleccionado, false);
        }

        return true;

    } catch (error) {

        listaMensajes.innerHTML = "";

        const aviso = document.createElement("p");
        aviso.className = "mensajes-vacio";
        aviso.textContent = error.message;

        listaMensajes.appendChild(aviso);

        cantidadMostrada.textContent = "0 mensajes";
        btnMarcarRespondido.disabled = true;

        return false;
    }
}


// ========================================
// 2. MOSTRAR LAS ESTADÍSTICAS
// ========================================

function mostrarResumen(resumen) {

    totalPendientes.textContent = resumen.pendientes;
    totalRespondidos.textContent = resumen.respondidos;
    totalMensajes.textContent = resumen.total;

}


// ========================================
// 3. DAR FORMATO A LA FECHA
// ========================================

function formatoFecha(fecha) {

    if (!fecha) {
        return "Sin fecha";
    }

    const fechaConvertida = new Date(
        String(fecha).replace(" ", "T")
    );

    if (isNaN(fechaConvertida.getTime())) {
        return fecha;
    }

    return fechaConvertida.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ========================================
// 4. CREAR LA ETIQUETA DEL ESTADO
// ========================================

function crearEstado(estado) {

    const etiqueta = document.createElement("span");

    etiqueta.className = "mensaje-estado";
    etiqueta.textContent = estado;

    if (estado === "Pendiente") {
        etiqueta.classList.add("pendiente");
    }

    if (estado === "Respondido") {
        etiqueta.classList.add("respondido");
    }

    return etiqueta;
}


// ========================================
// 5. BUSCAR Y FILTRAR MENSAJES
// ========================================

function mostrarMensajes() {

    const texto = buscarMensaje.value.trim().toLowerCase();
    const estadoElegido = filtrarEstadoMensaje.value;

    listaMensajes.innerHTML = "";

    // ARREGLOS: filtrar los mensajes
    const filtrados = mensajes.filter(function (mensaje) {

        const nombre = String(mensaje.nombre || "").toLowerCase();
        const correo = String(mensaje.correo || "").toLowerCase();
        const asunto = String(mensaje.asunto || "").toLowerCase();

        // BÚSQUEDA LINEAL: comprobar coincidencias
        const coincideTexto =
            nombre.includes(texto) ||
            correo.includes(texto) ||
            asunto.includes(texto);

        const coincideEstado =
            estadoElegido === "todos" ||
            mensaje.estatus === estadoElegido;

        return coincideTexto && coincideEstado;
    });

    // Mostrar cantidad de resultados
    cantidadMostrada.textContent =
        filtrados.length +
        (filtrados.length === 1 ? " mensaje" : " mensajes");

    // Si no existen coincidencias
    if (filtrados.length === 0) {

        const aviso = document.createElement("p");

        aviso.className = "mensajes-vacio";
        aviso.textContent = "No se encontraron mensajes.";

        listaMensajes.appendChild(aviso);

        return;
    }

    // ARREGLOS: recorrer los resultados
    filtrados.forEach(function (mensaje) {

        const tarjeta = crearTarjetaMensaje(mensaje);

        listaMensajes.appendChild(tarjeta);
    });
}


// ========================================
// 6. CREAR CADA TARJETA DE MENSAJE
// ========================================

function crearTarjetaMensaje(mensaje) {

    const tarjeta = document.createElement("button");

    tarjeta.type = "button";
    tarjeta.className = "mensaje-item";

    if (Number(mensaje.id_mensaje) === idMensajeSeleccionado) {
        tarjeta.classList.add("seleccionado");
    }

    // Nombre y fecha
    const superior = document.createElement("div");
    superior.className = "mensaje-item-superior";

    const nombre = document.createElement("span");
    nombre.className = "mensaje-item-nombre";
    nombre.textContent = mensaje.nombre;

    const fecha = document.createElement("span");
    fecha.className = "mensaje-item-fecha";
    fecha.textContent = formatoFecha(mensaje.fecha_envio);

    superior.appendChild(nombre);
    superior.appendChild(fecha);

    // Asunto
    const asunto = document.createElement("p");
    asunto.className = "mensaje-item-asunto";
    asunto.textContent = mensaje.asunto;

    // Vista previa del contenido
    const texto = document.createElement("p");
    texto.className = "mensaje-item-texto";

    const contenido = String(mensaje.mensaje || "");

    if (contenido.length > 100) {
        texto.textContent = contenido.substring(0, 100) + "...";
    } else {
        texto.textContent = contenido;
    }

    // Estado
    const estado = crearEstado(mensaje.estatus);

    tarjeta.appendChild(superior);
    tarjeta.appendChild(asunto);
    tarjeta.appendChild(texto);
    tarjeta.appendChild(estado);

    // Abrir el mensaje al seleccionarlo
    tarjeta.addEventListener("click", function () {
        seleccionarMensaje(mensaje.id_mensaje);
    });

    return tarjeta;
}



function seleccionarMensaje(id, limpiarAviso = true) {

    idMensajeSeleccionado = Number(id);

    // BÚSQUEDA LINEAL: buscar el mensaje por su ID
    const mensaje = mensajes.find(function (item) {
        return Number(item.id_mensaje) === idMensajeSeleccionado;
    });

    if (!mensaje) {

        mensajeDetalle.classList.add("oculto");
        mensajeSinSeleccion.classList.remove("oculto");

        idMensajeSeleccionado = null;
        btnMarcarRespondido.disabled = true;

        return;
    }

    // Mostrar el detalle
    mensajeSinSeleccion.classList.add("oculto");
    mensajeDetalle.classList.remove("oculto");

    detalleAsunto.textContent = mensaje.asunto;
    detalleNombre.textContent = mensaje.nombre;
    detalleCorreo.textContent = mensaje.correo;
    detalleFecha.textContent = formatoFecha(mensaje.fecha_envio);
    detalleContenido.textContent = mensaje.mensaje;

    // Actualizar el estado
    detalleEstado.textContent = mensaje.estatus;
    detalleEstado.className = "mensaje-estado";

    if (mensaje.estatus === "Pendiente") {
        detalleEstado.classList.add("pendiente");
    }

    if (mensaje.estatus === "Respondido") {
        detalleEstado.classList.add("respondido");
    }

    // Activar el botón solo si está pendiente
    if (mensaje.estatus === "Respondido") {

        btnMarcarRespondido.disabled = true;
        btnMarcarRespondido.textContent = "Mensaje respondido";

    } else if (mensaje.estatus === "Pendiente") {

        btnMarcarRespondido.disabled = guardandoMensaje;
        btnMarcarRespondido.textContent = "Marcar como respondido";

    } else {

        btnMarcarRespondido.disabled = true;
        btnMarcarRespondido.textContent = "Estado no disponible";
    }

    if (limpiarAviso) {
        mensajeAccion.textContent = "";
    }

    // Resaltar el mensaje seleccionado
    mostrarMensajes();
}


// ========================================
// 8. MARCAR MENSAJE COMO RESPONDIDO
// ========================================

async function marcarComoRespondido() {

    // Comprobar que se haya seleccionado un mensaje
    if (idMensajeSeleccionado === null || guardandoMensaje) {
        return;
    }

    // Buscar el mensaje seleccionado
    const mensaje = mensajes.find(function (item) {
        return Number(item.id_mensaje) === idMensajeSeleccionado;
    });

    // Solo actualizar mensajes pendientes
    if (!mensaje || mensaje.estatus !== "Pendiente") {
        return;
    }

    // Guardar el ID antes de realizar la solicitud
    const idActualizar = idMensajeSeleccionado;

    // Evitar clics repetidos mientras se guarda
    guardandoMensaje = true;
    btnMarcarRespondido.disabled = true;

    mensajeAccion.textContent = "Guardando cambio...";

    try {

        // Enviar el ID del mensaje a PHP
        const respuesta = await fetch(
            "../php/admin_actualizar_mensaje.php",
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_mensaje: idActualizar
                })
            }
        );

        // Verificar que siga siendo administrador
        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.replace("login.html");
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No se pudo actualizar el mensaje."
            );
        }

        // Consultar MySQL nuevamente para mostrar datos reales
        const actualizado = await cargarMensajes();

        if (actualizado) {
            mensajeAccion.textContent =
                "Mensaje marcado como respondido correctamente.";
        } else {
            mensajeAccion.textContent =
                "Se guardó el cambio, pero no se pudo actualizar la lista.";
        }

    } catch (error) {

        mensajeAccion.textContent = error.message;

    } finally {

        guardandoMensaje = false;

        // Recuperar el estado correcto del botón
        if (idMensajeSeleccionado !== null) {
            seleccionarMensaje(idMensajeSeleccionado, false);
        }
    }
}


// ========================================
// 9. EVENTOS DEL BUSCADOR Y FILTRO
// ========================================

// Buscar mientras escribe
buscarMensaje.addEventListener("input", mostrarMensajes);

// Filtrar cuando cambia el estado
filtrarEstadoMensaje.addEventListener("change", mostrarMensajes);

// Guardar el cambio de estado
btnMarcarRespondido.addEventListener(
    "click",
    marcarComoRespondido
);


// ========================================
// 10. CERRAR SESIÓN
// ========================================

adminCerrarSesion.addEventListener("click", async function () {

    try {

        const respuesta = await fetch("../php/cerrar_sesion.php", {
            method: "POST",
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cerrar la sesión.");
        }

        window.location.replace("login.html");

    } catch (error) {

        alert(error.message);
    }
});

// Desactivar el botón hasta seleccionar un mensaje
btnMarcarRespondido.disabled = true;

// Consultar MySQL al abrir la página
cargarMensajes();
