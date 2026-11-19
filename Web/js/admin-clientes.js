const buscarCliente = document.getElementById("buscarCliente");
const tablaClientes = document.getElementById("tablaClientes");
const cantidadClientes = document.getElementById("cantidadClientes");

const clienteSinSeleccion = document.getElementById("clienteSinSeleccion");
const clienteDetalle = document.getElementById("clienteDetalle");

const detalleIdCliente = document.getElementById("detalleIdCliente");
const detalleNombreCliente = document.getElementById("detalleNombreCliente");
const detalleCorreoCliente = document.getElementById("detalleCorreoCliente");
const detalleRolCliente = document.getElementById("detalleRolCliente");

const adminCerrarSesion = document.getElementById("adminCerrarSesion");

// guardar los clientes (arreglo)
let clientes = [];

async function cargarClientes() {

    try {

        const respuesta = await fetch("../php/admin_clientes.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        // Comprobar que sea administrador
        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.replace("login.html");
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No se pudieron cargar los clientes."
            );
        }

        clientes = datos.clientes;

        mostrarClientes();

    } catch (error) {

        tablaClientes.innerHTML = "";

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 5;
        celda.className = "clientes-vacio";
        celda.textContent = error.message;

        fila.appendChild(celda);
        tablaClientes.appendChild(fila);

        cantidadClientes.textContent = "0 clientes";
    }
}

function mostrarClientes() {

    // Obtener lo que escribe el administrador
    const texto = buscarCliente.value.trim().toLowerCase();

    // Limpiar la tabla
    tablaClientes.innerHTML = "";

    // revisar cada cliente (búsqueda lineal)
    const filtrados = clientes.filter(function (cliente) {

        const nombre = String(
            cliente.nombre_completo || ""
        ).toLowerCase();

        const correo = String(
            cliente.correo || ""
        ).toLowerCase();

        return nombre.includes(texto) || correo.includes(texto);
    });

    // Mostrar la cantidad encima de la tabla
    cantidadClientes.textContent =
        filtrados.length +
        (filtrados.length === 1 ? " cliente" : " clientes");

    // Si no se encontraron clientes
    if (filtrados.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 5;
        celda.className = "clientes-vacio";
        celda.textContent = "No se encontraron clientes.";

        fila.appendChild(celda);
        tablaClientes.appendChild(fila);

        return;
    }

    // mostrar cada cliente encontrado (arreglos)
    filtrados.forEach(function (cliente) {

        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = cliente.id_usuario;

        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = cliente.nombre_completo;

        const celdaCorreo = document.createElement("td");
        celdaCorreo.textContent = cliente.correo;

        const celdaRol = document.createElement("td");
        celdaRol.textContent = cliente.rol;

        const celdaAccion = document.createElement("td");

        // Botón Ver detalles
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "cliente-btn-detalle";
        boton.textContent = "Ver detalles";

        boton.addEventListener("click", function () {
            mostrarDetalleCliente(cliente.id_usuario);
        });

        celdaAccion.appendChild(boton);

        // Autorizar solamente correos institucionales, con aprobación humana.
        const correoInstitucional = /^[^@\s]+@modelo\.com$/i.test(cliente.correo);
        if (correoInstitucional && cliente.rol === "Cliente") {
            const autorizar = document.createElement("button");
            autorizar.type = "button";
            autorizar.className = "cliente-btn-autorizar";
            autorizar.textContent = "Autorizar empleado";
            autorizar.addEventListener("click", function () {
                autorizarEmpleado(cliente.id_usuario);
            });
            celdaAccion.appendChild(autorizar);
        }

        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaCorreo);
        fila.appendChild(celdaRol);
        fila.appendChild(celdaAccion);

        tablaClientes.appendChild(fila);
    });
}


function mostrarDetalleCliente(id) {

    const cliente = clientes.find(function (item) {
        return Number(item.id_usuario) === Number(id);
    });

    if (!cliente) {
        return;
    }

    // Mostrar el panel de detalles
    clienteSinSeleccion.classList.add("oculto");
    clienteDetalle.classList.remove("oculto");

    detalleIdCliente.textContent = cliente.id_usuario;
    detalleNombreCliente.textContent = cliente.nombre_completo;
    detalleCorreoCliente.textContent = cliente.correo;
    detalleRolCliente.textContent = cliente.rol;
}



// Solo el administrador puede autorizar cuentas institucionales.
async function autorizarEmpleado(id) {
    const cliente = clientes.find(function (c) {
        return Number(c.id_usuario) === Number(id);
    });
    if (!cliente) return;

    const confirmado = window.confirm(
        "¿Ya verificaste que " + cliente.nombre_completo +
        " trabaja en Grupo Modelo y es dueño/a del correo " + cliente.correo +
        "?\n\nAutorizar dará acceso a TODO el panel administrativo."
    );
    if (!confirmado) return;

    try {
        const respuesta = await fetch("../php/admin_autorizar_empleado.php", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: id })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok || !datos.exito) {
            throw new Error(datos.mensaje || "No se pudo autorizar la cuenta.");
        }
        alert(datos.mensaje);
        // El usuario dejará de mostrarse como cliente después de autorizarlo.
        cargarClientes();
    } catch (error) {
        alert(error.message);
    }
}

buscarCliente.addEventListener("input", mostrarClientes);


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


cargarClientes();
