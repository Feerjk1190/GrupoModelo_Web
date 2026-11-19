// Obtener los elementos del inventario
const listaInventario = document.getElementById("listaInventario");

const buscarInventario = document.getElementById("buscarInventario");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroStock = document.getElementById("filtroStock");
const limpiarInventario = document.getElementById("limpiarInventario");

const mensajeInventario = document.getElementById("mensajeInventario");

const totalProductos = document.getElementById("totalProductos");
const totalBajoStock = document.getElementById("totalBajoStock");
const totalEntradas = document.getElementById("totalEntradas");
const totalSalidas = document.getElementById("totalSalidas");

// Elementos del formulario de entrada
const abrirEntrada = document.getElementById("abrirEntrada");
const panelEntrada = document.getElementById("panelEntrada");
const formEntrada = document.getElementById("formEntrada");

const productoEntrada = document.getElementById("productoEntrada");
const cantidadEntrada = document.getElementById("cantidadEntrada");
const stockEntrada = document.getElementById("stockEntrada");

const guardarEntrada = document.getElementById("guardarEntrada");
const cancelarEntrada = document.getElementById("cancelarEntrada");
const mensajeEntrada = document.getElementById("mensajeEntrada");

// ARREGLO: guardar los productos obtenidos desde MySQL
let productos = [];
let guardandoEntrada = false;

// Convertir las categorías en nombres fáciles de leer
function nombreCategoria(categoria) {

    switch (String(categoria).toLowerCase()) {

        case "latas":
            return "Latas";

        case "botellas":
            return "Botellas";

        case "sixpacks":
            return "Six packs";

        default:
            return categoria || "Sin categoría";
    }
}

// Elegir el color según las existencias del producto
function claseEstado(estado) {

    switch (estado) {

        case "Disponible":
            return "inventario-disponible";

        case "Bajo stock":
            return "inventario-bajo";

        case "Agotado":
            return "inventario-agotado";

        default:
            return "";
    }
}

// Mostrar las estadísticas recibidas desde PHP
function mostrarEstadisticas(resumen) {

    totalProductos.textContent = resumen.total_productos;

    totalBajoStock.textContent =
        Number(resumen.bajo_stock) +
        Number(resumen.agotados);

    totalEntradas.textContent = resumen.entradas;
    totalSalidas.textContent = resumen.salidas;
}

// Crear una celda de la tabla
function crearCelda(texto) {

    const celda = document.createElement("td");
    celda.textContent = texto;

    return celda;
}

// BÚSQUEDA LINEAL: buscar productos por nombre
// También se aplican los filtros de categoría y disponibilidad
function mostrarProductos() {

    listaInventario.innerHTML = "";

    const texto = buscarInventario.value.trim().toLowerCase();

    const categoriaSeleccionada = filtroCategoria.value;
    const estadoSeleccionado = filtroStock.value;

    let encontrados = 0;

    // ARREGLOS: recorrer los productos uno por uno
    productos.forEach(function (producto) {

        const nombre = String(producto.nombre).toLowerCase();
        const categoria = String(producto.categoria).toLowerCase();
        const estado = producto.estado_inventario;

        // Comprobar si coincide con el texto escrito
        const coincideNombre = nombre.includes(texto);

        // Comprobar si coincide con la categoría
        const coincideCategoria =
            categoriaSeleccionada === "todos" ||
            categoria === categoriaSeleccionada;

        // Comprobar si coincide con el estado
        const coincideEstado =
            estadoSeleccionado === "todos" ||
            estado === estadoSeleccionado;

        if (
            !coincideNombre ||
            !coincideCategoria ||
            !coincideEstado
        ) {
            return;
        }

        encontrados++;

        // Crear una fila para mostrar el producto
        const fila = document.createElement("tr");

        const columnaProducto = document.createElement("td");

        const contenedorProducto = document.createElement("div");
        contenedorProducto.className = "inventario-producto";

        const imagen = document.createElement("img");
        imagen.src = "../img/" +
            encodeURIComponent(producto.imagen || "");

        imagen.alt = producto.nombre;

        const nombreProducto = document.createElement("strong");
        nombreProducto.textContent = producto.nombre;

        contenedorProducto.append(
            imagen,
            nombreProducto
        );

        columnaProducto.appendChild(contenedorProducto);

        // Crear las columnas del inventario
        const columnaCategoria = crearCelda(
            nombreCategoria(producto.categoria)
        );

        const columnaPresentacion = crearCelda(
            producto.presentacion || "No especificada"
        );

        const columnaStock = crearCelda(
            producto.stock_disponible
        );

        const columnaEntradas = crearCelda(
            producto.entradas
        );

        const columnaSalidas = crearCelda(
            producto.salidas
        );

        // Resaltar productos con pocas existencias
        if (estado === "Bajo stock") {
            columnaStock.className = "inventario-stock-bajo";
        }

        if (estado === "Agotado") {
            columnaStock.className = "inventario-stock-agotado";
        }

        // Crear la etiqueta de disponibilidad
        const columnaEstado = document.createElement("td");

        const etiquetaEstado = document.createElement("span");

        etiquetaEstado.className =
            "inventario-estado " + claseEstado(estado);

        etiquetaEstado.textContent = estado;

        columnaEstado.appendChild(etiquetaEstado);

        fila.append(
            columnaProducto,
            columnaCategoria,
            columnaPresentacion,
            columnaStock,
            columnaEntradas,
            columnaSalidas,
            columnaEstado
        );

        listaInventario.appendChild(fila);
    });

    // Comprobar si no se encontraron productos
    if (encontrados === 0) {

        const fila = document.createElement("tr");

        const celda = crearCelda(
            "No se encontraron coincidencias."
        );

        celda.colSpan = 7;

        fila.appendChild(celda);
        listaInventario.appendChild(fila);
    }

    mensajeInventario.textContent =
        "Mostrando " + encontrados + " de " +
        productos.length + " productos.";
}

// Colocar los productos de MySQL en el formulario de entrada
function llenarProductosEntrada() {

    // Conservar el producto seleccionado al actualizar la lista
    const seleccionado = productoEntrada.value;

    productoEntrada.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Selecciona un producto";

    productoEntrada.appendChild(opcionInicial);

    // Recorrer todos los productos disponibles en el inventario
    productos.forEach(function (producto) {

        const opcion = document.createElement("option");

        opcion.value = producto.id_producto;
        opcion.textContent = producto.nombre;

        productoEntrada.appendChild(opcion);
    });

    productoEntrada.value = seleccionado;

    mostrarStockEntrada();
}

// BÚSQUEDA LINEAL: encontrar el producto seleccionado por su ID
function buscarProductoEntrada(id) {

    return productos.find(function (producto) {
        return Number(producto.id_producto) === Number(id);
    });
}

// Mostrar las existencias del producto seleccionado
function mostrarStockEntrada() {

    const id = productoEntrada.value;

    if (!id) {
        stockEntrada.textContent = "";
        return;
    }

    const producto = buscarProductoEntrada(id);

    if (!producto) {
        stockEntrada.textContent =
            "No se encontró el producto.";
        return;
    }

    stockEntrada.textContent =
        "Existencias actuales: " +
        producto.stock_disponible + " unidades.";
}

// Mostrar un mensaje dentro del formulario
function mostrarMensajeEntrada(texto, tipo = "") {

    mensajeEntrada.textContent = texto;
    mensajeEntrada.className = "inventario-mensaje " + tipo;
}

// Abrir el formulario de entrada
function mostrarFormularioEntrada() {

    panelEntrada.hidden = false;
    abrirEntrada.disabled = true;

    mostrarMensajeEntrada("");

    // Mostrar las existencias actuales del producto
    mostrarStockEntrada();
}

// Cerrar el formulario de entrada
function cerrarFormularioEntrada() {

    if (guardandoEntrada) {
        return;
    }

    panelEntrada.hidden = true;
    abrirEntrada.disabled = false;

    formEntrada.reset();
    stockEntrada.textContent = "";

    mostrarMensajeEntrada("");
}

// Consultar los datos del inventario desde PHP y MySQL
async function cargarInventario() {

    mensajeInventario.textContent = "Cargando inventario...";

    try {

        const respuesta = await fetch(
            "../php/admin_inventario.php",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        // Comprobar que el usuario sea administrador
        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {
            window.location.replace("login.html");
            return false;
        }

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo consultar el inventario."
            );
        }

        const datos = await respuesta.json();

        if (
            !datos.exito ||
            !Array.isArray(datos.productos) ||
            !datos.resumen
        ) {
            throw new Error(
                "La información del inventario no es válida."
            );
        }

        // Guardar los productos en un arreglo
        productos = datos.productos;

        // Actualizar la tabla y las estadísticas
        mostrarEstadisticas(datos.resumen);
        mostrarProductos();

        // Actualizar también los productos del formulario
        llenarProductosEntrada();

        return true;

    } catch (error) {

        console.error("Error al cargar el inventario:", error);

        mensajeInventario.textContent =
            "No se pudo actualizar el inventario.";

        return false;
    }
}

// Registrar una nueva entrada de mercancía
async function registrarEntrada(evento) {

    // Evitar que el formulario recargue la página
    evento.preventDefault();

    if (guardandoEntrada) {
        return;
    }

    const idProducto = Number(productoEntrada.value);
    const cantidad = Number(cantidadEntrada.value);

    // Validar que se haya seleccionado un producto
    if (!idProducto) {
        mostrarMensajeEntrada(
            "Selecciona un producto.",
            "error"
        );
        return;
    }

    // Validar que la cantidad sea un número entero
    if (
        cantidadEntrada.value.trim() === "" ||
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 10000
    ) {
        mostrarMensajeEntrada(
            "Ingresa una cantidad entre 1 y 10000.",
            "error"
        );
        return;
    }

    // Buscar el producto seleccionado
    const producto = buscarProductoEntrada(idProducto);

    if (!producto) {
        mostrarMensajeEntrada(
            "El producto seleccionado no existe.",
            "error"
        );
        return;
    }

    // Confirmar la cantidad antes de modificar MySQL
    const confirmar = window.confirm(
        "¿Registrar " + cantidad +
        " unidades de " + producto.nombre + "?"
    );

    if (!confirmar) {
        return;
    }

    guardandoEntrada = true;
    guardarEntrada.disabled = true;
    cancelarEntrada.disabled = true;

    mostrarMensajeEntrada("Guardando entrada...");

    try {

        // POST: enviar el ID y la cantidad al archivo PHP
        const respuesta = await fetch(
            "../php/admin_registrar_entrada.php",
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_producto: idProducto,
                    cantidad: cantidad
                })
            }
        );

        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {
            window.location.replace("login.html");
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            throw new Error(
                datos.mensaje ||
                "No se pudo registrar la entrada."
            );
        }

        // Consultar MySQL otra vez para mostrar las nuevas existencias
        const actualizado = await cargarInventario();

        if (actualizado) {

            cantidadEntrada.value = "";

            mostrarMensajeEntrada(
                "Entrada registrada correctamente.",
                "exito"
            );

        } else {

            mostrarMensajeEntrada(
                "La entrada se guardó, pero no se pudo " +
                "actualizar la tabla. Recarga la página " +
                "para consultar las existencias.",
                "error"
            );
        }

    } catch (error) {

        console.error("Error al registrar la entrada:", error);

        mostrarMensajeEntrada(
            "No se pudo confirmar el resultado. " +
            "Revisa las existencias antes de intentarlo otra vez. " +
            error.message,
            "error"
        );

    } finally {

        guardandoEntrada = false;
        guardarEntrada.disabled = false;
        cancelarEntrada.disabled = false;
    }
}

// Buscar mientras el administrador escribe
buscarInventario.addEventListener("input", mostrarProductos);

// Filtrar por categoría
filtroCategoria.addEventListener("change", mostrarProductos);

// Filtrar según las existencias
filtroStock.addEventListener("change", mostrarProductos);

// Limpiar los filtros de la tabla
limpiarInventario.addEventListener("click", function () {

    buscarInventario.value = "";
    filtroCategoria.value = "todos";
    filtroStock.value = "todos";

    mostrarProductos();
});

// Abrir el formulario
abrirEntrada.addEventListener("click", mostrarFormularioEntrada);

// Cerrar el formulario sin guardar
cancelarEntrada.addEventListener("click", cerrarFormularioEntrada);

// Actualizar el texto de existencias cuando se cambia de producto
productoEntrada.addEventListener("change", mostrarStockEntrada);

// Registrar la entrada cuando se envía el formulario
formEntrada.addEventListener("submit", registrarEntrada);

// Cargar el inventario al abrir la página
cargarInventario();
