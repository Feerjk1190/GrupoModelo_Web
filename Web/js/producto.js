const tiposEnvase = [
    "Lata",
    "Botella",
    "Six pack",
    "Mega retornable"
];

function obtenerTipoEnvase(producto) {

    const presentacion = String(producto.presentacion || "")
        .toLowerCase();

    const categoria = String(producto.categoria || "")
        .toLowerCase();

    if (presentacion.includes("mega retornable")) {
        return tiposEnvase[3];
    }

    if (categoria === "latas" || presentacion.includes("lata")) {
        return tiposEnvase[0];
    }

    if (categoria === "botellas" || presentacion.includes("botella")) {
        return tiposEnvase[1];
    }

    if (categoria === "sixpacks") {
        if (presentacion.includes("lata")) {
            return tiposEnvase[0];
        }

        if (presentacion.includes("botella")) {
            return tiposEnvase[1];
        }

        return tiposEnvase[2];
    }

    return "No especificado";
}

function obtenerPresentacion(producto) {

    const presentacion = String(producto.presentacion || "").trim();
    const texto = presentacion.toLowerCase();

    if (!presentacion) {
        return "Presentación no especificada";
    }

    if (/\b(caja|paquete)\b/.test(texto) && /\d+/.test(texto)) {
        return presentacion;
    }

    if (
        producto.categoria === "sixpacks" ||
        /\bsix[\s-]*pack\b/i.test(presentacion)
    ) {
        if (texto.includes("lata")) {
            return "Paquete de 6 latas";
        }

        if (texto.includes("botella")) {
            return "Paquete de 6 botellas";
        }

        return "Paquete de 6 unidades";
    }

    return presentacion;
}

function formatoPrecioDetalle(precio) {
    return Number(precio).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

const parametros = new URLSearchParams(window.location.search);
const idProducto = Number(parametros.get("id"));

let productoSeleccionado = null;

function mostrarDetalle(producto) {

    document.getElementById("detalleNombre").textContent =
        producto.nombre;

    const imagen = document.getElementById("detalleImagen");

    imagen.src = "../img/" + encodeURIComponent(producto.imagen);
    imagen.alt = producto.nombre;

    const precioOriginal = Number(producto.precio);
    const descuento = Number(producto.descuento_porcentaje) || 0;

    const precioFinal = Math.round(
        precioOriginal * (1 - descuento / 100) * 100
    ) / 100;

    const precioActual = document.getElementById("detallePrecio");
    const precioAnterior = document.getElementById("detallePrecioAnterior");

    if (descuento > 0) {

        precioAnterior.textContent =
            formatoPrecioDetalle(precioOriginal);

        precioAnterior.style.display = "inline";
        precioAnterior.style.textDecoration = "line-through";

        precioActual.textContent =
            formatoPrecioDetalle(precioFinal);

        precioActual.style.color = "#dc2626";

    } else {

        precioAnterior.textContent = "";
        precioAnterior.style.display = "none";

        precioActual.textContent =
            formatoPrecioDetalle(precioOriginal);

        precioActual.style.color = "";
    }

    const nombresCategorias = {
        latas: "Latas",
        botellas: "Botellas",
        sixpacks: "Six packs"
    };

    document.getElementById("detalleCategoria").textContent =
        "Cervezas / " +
        (nombresCategorias[producto.categoria] || producto.categoria);

    const presentacion = obtenerPresentacion(producto);

    document.getElementById("detalleDescripcion").textContent =
        presentacion;

    document.getElementById("detallePresentacion").textContent =
        presentacion;

    document.getElementById("detalleTipoEnvase").textContent =
        obtenerTipoEnvase(producto);

    document.getElementById("detalleMarca").textContent =
        producto.nombre;

    document.getElementById("detalleStock").textContent =
        producto.stock + " unidades disponibles";

    const disponible =
        Number(producto.stock) > 0 && producto.estatus !== "Agotado";

    const estado = document.getElementById("detalleEstado");

    const pocasUnidades =
        disponible && Number(producto.stock) <= 10;

    estado.textContent = !disponible
        ? "Agotado"
        : pocasUnidades
            ? "Últimas unidades"
            : "Disponible";

    estado.className = !disponible
        ? "detalle-disponible detalle-agotado"
        : pocasUnidades
            ? "detalle-disponible detalle-bajo"
            : "detalle-disponible";

    document.getElementById("detalleDisponibilidad").textContent =
        !disponible
            ? "Sin existencia"
            : pocasUnidades
                ? "Últimas unidades"
                : "En existencia";

    const cantidad = document.getElementById("detalleCantidad");

    cantidad.min = 1;
    cantidad.max = producto.stock;
    cantidad.value = disponible ? 1 : 0;
    cantidad.disabled = !disponible;

    const botonAgregar = document.getElementById("detalleAgregar");

    botonAgregar.disabled = !disponible;
}

function mostrarErrorDetalle(mensaje) {

    const contenedor = document.querySelector(".detalle-contenedor");

    contenedor.innerHTML = `
        <section class="detalle-informacion">
            <h1>No se pudo mostrar el producto</h1>
            <p id="mensajeErrorProducto"></p>
            <a href="catalogo.html">Regresar al catálogo</a>
        </section>
    `;

    document.getElementById("mensajeErrorProducto").textContent =
        mensaje;
}

async function cargarDetalle() {

    try {

        if (!Number.isInteger(idProducto) || idProducto < 1) {
            mostrarErrorDetalle("Identificador no válido.");
            return;
        }

        const respuesta = await fetch("../php/productos.php", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar el inventario.");
        }

        const datos = await respuesta.json();

        if (!datos.exito || !Array.isArray(datos.productos)) {
            throw new Error("Respuesta incorrecta del servidor.");
        }

        productoSeleccionado = datos.productos.find(function (producto) {
            return Number(producto.id) === idProducto;
        });

        if (!productoSeleccionado) {
            mostrarErrorDetalle("El producto solicitado no existe.");
            return;
        }

        mostrarDetalle(productoSeleccionado);

    } catch (error) {

        console.error("Error al cargar el producto:", error);

        mostrarErrorDetalle(
            "No se pudo consultar el producto. Intenta nuevamente."
        );
    }
}

cargarDetalle();
