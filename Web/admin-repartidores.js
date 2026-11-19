
/*
    GRUPO MODELO
    Administracion de repartidores

    Este archivo conecta el formulario HTML
    con admin_repartidores.php y MySQL.

    Si cambia la carpeta del proyecto,
    revisar las rutas de fetch().
*/

// Obtener elementos del HTML

const formulario = document.getElementById("formRepartidor");

const tabla = document.getElementById("tablaRepartidores");

const mensaje = document.getElementById("mensaje");

const cantidad = document.getElementById("cantidadRepartidores");

const btnGuardar = document.getElementById("btnGuardar");

const btnCancelar = document.getElementById("btnCancelar");

// Guardar los repartidores encontrados
let repartidores = [];


// ========================================
// 1. CONSULTAR REPARTIDORES
// ========================================

async function cargarRepartidores() {

    try {

        const respuesta = await fetch(
            "../php/admin_repartidores.php",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        // Comprobar sesion del administrador
        if (respuesta.status === 401 ||
            respuesta.status === 403) {

            window.location.replace("login.html");
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || datos.exito !== true) {

            throw new Error(
                datos.mensaje || "No se pudo cargar la lista"
            );
        }

        // Guardar los resultados
        repartidores = datos.repartidores || [];

        // Mostrar la tabla
        mostrarRepartidores();

        document.body.classList.remove("admin-oculto");

    } catch (error) {

        console.error(error);

        mensaje.textContent =
            "Error al cargar: " + error.message;

        document.body.classList.remove("admin-oculto");
    }
}


// ========================================
// 2. MOSTRAR TABLA DE REPARTIDORES
// ========================================

function mostrarRepartidores() {

    tabla.innerHTML = "";

    cantidad.textContent =
        repartidores.length + " repartidores registrados";

    if (repartidores.length === 0) {

        const fila = tabla.insertRow();
        const celda = fila.insertCell();

        celda.colSpan = 8;

        celda.textContent =
            "Todavia no hay repartidores registrados";

        return;
    }

    repartidores.forEach(function(repartidor) {

        const fila = tabla.insertRow();

        const campos = [
            repartidor.id_repartidor,
            repartidor.nombre,
            repartidor.usuario,
            repartidor.grupo,
            repartidor.placa_vehiculo,
            repartidor.telefono,
            Number(repartidor.activo) === 1
                ? "Activo"
                : "Inactivo"
        ];

        campos.forEach(function(valor) {

            const celda = fila.insertCell();

            celda.textContent = valor;
        });

        // Columna de acciones
        const acciones = fila.insertCell();

        // Boton editar
        const botonEditar = document.createElement("button");

        botonEditar.type = "button";
        botonEditar.textContent = "Editar";
        botonEditar.className = "repartidores-accion";

        botonEditar.addEventListener("click", function() {

            editarRepartidor(repartidor);
        });

        acciones.appendChild(botonEditar);

        // Boton activar o desactivar
        const botonEstado = document.createElement("button");

        botonEstado.type = "button";
        botonEstado.className = "repartidores-accion";

        if (Number(repartidor.activo) === 1) {

            botonEstado.textContent = "Desactivar";

        } else {

            botonEstado.textContent = "Activar";
        }

        botonEstado.addEventListener("click", function() {

            cambiarEstado(repartidor);
        });

        acciones.appendChild(botonEstado);
    });
}


// ========================================
// 3. EDITAR REPARTIDOR
// ========================================

function editarRepartidor(repartidor) {

    document.getElementById("idRepartidor").value =
        repartidor.id_repartidor;

    document.getElementById("nombre").value =
        repartidor.nombre;

    document.getElementById("usuario").value =
        repartidor.usuario;

    document.getElementById("contrasena").value = "";

    document.getElementById("grupo").value =
        repartidor.grupo;

    document.getElementById("placa").value =
        repartidor.placa_vehiculo;

    document.getElementById("telefono").value =
        repartidor.telefono;

    document.getElementById("tituloFormulario").textContent =
        "Editar repartidor";

    btnGuardar.textContent = "Guardar cambios";

    mensaje.textContent =
        "Editando a " + repartidor.nombre;

    window.scrollTo(0, 0);
}


// ========================================
// 4. LIMPIAR FORMULARIO
// ========================================

function limpiarFormulario() {

    formulario.reset();

    document.getElementById("idRepartidor").value = "0";

    document.getElementById("tituloFormulario").textContent =
        "Registrar repartidor";

    btnGuardar.textContent = "Guardar repartidor";
}


// ========================================
// 5. ENVIAR DATOS A PHP
// ========================================

async function enviarDatos(datos) {

    const respuesta = await fetch(
        "../php/admin_repartidores.php",
        {
            method: "POST",
            body: datos,
            credentials: "same-origin"
        }
    );

    if (respuesta.status === 401 ||
        respuesta.status === 403) {

        window.location.replace("login.html");

        throw new Error("Sesion de administrador terminada");
    }

    const resultado = await respuesta.json();

    if (!respuesta.ok || resultado.exito !== true) {

        throw new Error(
            resultado.mensaje || "No se pudo guardar"
        );
    }

    return resultado;
}


// ========================================
// 6. REGISTRAR O GUARDAR CAMBIOS
// ========================================

formulario.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    btnGuardar.disabled = true;

    const datos = new FormData(formulario);

    datos.append("accion", "guardar");

    try {

        const resultado = await enviarDatos(datos);

        limpiarFormulario();

        await cargarRepartidores();

        mensaje.textContent = resultado.mensaje;

    } catch (error) {

        mensaje.textContent = error.message;

        console.error(error);

    } finally {

        btnGuardar.disabled = false;
    }
});


// ========================================
// 7. ACTIVAR O DESACTIVAR REPARTIDOR
// ========================================

async function cambiarEstado(repartidor) {

    let nuevoEstado = "0";

    if (Number(repartidor.activo) === 0) {

        nuevoEstado = "1";
    }

    let accion = "desactivar";

    if (nuevoEstado === "1") {

        accion = "activar";
    }

    const confirmar = confirm(
        "¿Deseas " + accion + " a " + repartidor.nombre + "?"
    );

    if (!confirmar) {
        return;
    }

    const datos = new FormData();

    datos.append("accion", "estado");

    datos.append(
        "id_repartidor",
        repartidor.id_repartidor
    );

    datos.append("activo", nuevoEstado);

    try {

        const resultado = await enviarDatos(datos);

        await cargarRepartidores();

        mensaje.textContent = resultado.mensaje;

    } catch (error) {

        mensaje.textContent = error.message;

        console.error(error);
    }
}


// ========================================
// 8. BOTON CANCELAR
// ========================================

btnCancelar.addEventListener("click", function() {

    limpiarFormulario();

    mensaje.textContent = "";
});


// ========================================
// 9. CARGAR DATOS AL ABRIR LA PAGINA
// ========================================

cargarRepartidores();
