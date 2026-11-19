const listaCarrito = document.getElementById("listaCarrito");
const carritoVacio = document.getElementById("carritoVacio");
const carritoAviso = document.getElementById("carritoAviso");

const cantidadProductos = document.getElementById("cantidadProductos");
const resumenCantidad = document.getElementById("resumenCantidad");
const resumenSubtotal = document.getElementById("resumenSubtotal");
const resumenTotal = document.getElementById("resumenTotal");

const botonConfirmar = document.getElementById("confirmarPedido");

let carrito = [];
let productosBD = [];
let claveCarrito = null;
let carritoCargado = false;

// cola

// agregar un producto al final de la cola
function encolar(cola, producto) {
    cola.push(producto);
}

// retirar el primer producto de la cola
function desencolar(cola) {
    if (cola.length === 0) {
        return null;
    }

    return cola.shift();
}

// consultar el primer producto sin retirarlo
function frenteCola(cola) {
    if (cola.length === 0) {
        return null;
    }

    return cola[0];
}

// comprobar si la cola está vacía
function colaVacia(cola) {
    return cola.length === 0;
}

function formatoPrecio(numero) {
    return Number(numero).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

// búsqueda lineal
function buscarProducto(id) {
    return productosBD.find(function (producto) {
        return Number(producto.id) === Number(id);
    });
}

// descuento
function obtenerPrecioFinal(producto) {
    const precio = Number(producto.precio);
    const descuento = Number(producto.descuento_porcentaje) || 0;

    return Math.round(
        precio * (1 - descuento / 100) * 100
    ) / 100;
}

// RECURSIVIDAD: sumar los importes de los productos con sus descuentos.
// Caso base: cuando ya no hay productos, devolver cero centavos.
// Paso recursivo: importe actual + importe de los productos restantes.
function calcularTotalRecursivo(items, indice = 0) {
    if (indice >= items.length) {
        return 0;
    }

    const item = items[indice];
    const producto = buscarProducto(item.id);

    const importeCentavos = producto
        ? Math.round(obtenerPrecioFinal(producto) * 100) * item.cantidad
        : 0;

    return importeCentavos + calcularTotalRecursivo(items, indice + 1);
}

function guardarCarrito() {
    if (claveCarrito === null) {
        return;
    }

    localStorage.setItem(
        claveCarrito,
        JSON.stringify(carrito)
    );
}

function leerCarrito() {
    const guardado = localStorage.getItem(claveCarrito);

    if (!guardado) {
        return [];
    }

    let datos;

    try {
        datos = JSON.parse(guardado);
    } catch (error) {
        throw new Error("Los datos guardados del carrito no son válidos.");
    }

    if (!Array.isArray(datos)) {
        throw new Error("El carrito no tiene un formato válido.");
    }

    const cantidades = new Map();

    datos.forEach(function (item) {
        const id = Number(item.id);
        const cantidad = Number(item.cantidad);

        if (
            !Number.isInteger(id) ||
            !Number.isInteger(cantidad) ||
            cantidad < 1
        ) {
            return;
        }

        const producto = buscarProducto(id);

        if (!producto) {
            return;
        }

        const stock = Number(producto.stock);

        if (stock <= 0 || producto.estatus === "Agotado") {
            return;
        }

        const acumulado = cantidades.get(id) || 0;

        cantidades.set(
            id,
            Math.min(acumulado + cantidad, stock)
        );
    });

    const colaProductos = [];

    cantidades.forEach(function (cantidad, id) {
        encolar(colaProductos, { id, cantidad });
    });

    return colaProductos;
}

function mostrarCarrito() {
    listaCarrito.innerHTML = "";

    let unidades = 0;

    carrito.forEach(function (item) {
        const producto = buscarProducto(item.id);

        if (!producto) {
            return;
        }

        const precioOriginal = Number(producto.precio);
        const descuento = Number(producto.descuento_porcentaje) || 0;
        const precioFinal = obtenerPrecioFinal(producto);

        const importe = Math.round(
            precioFinal * item.cantidad * 100
        ) / 100;

        unidades += item.cantidad;

        const articulo = document.createElement("article");
        articulo.className = "carrito-producto";

        const contenedorImagen = document.createElement("div");
        contenedorImagen.className = "carrito-imagen";

        const imagen = document.createElement("img");
        imagen.src = "../img/" + encodeURIComponent(producto.imagen);
        imagen.alt = producto.nombre;

        contenedorImagen.appendChild(imagen);

        const informacion = document.createElement("div");
        informacion.className = "carrito-datos";

        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre;

        const presentacion = document.createElement("p");
        presentacion.textContent = producto.presentacion;

        const disponibilidad = document.createElement("span");
        disponibilidad.className = "carrito-stock";

        if (Number(producto.stock) <= 10) {
            disponibilidad.textContent = "Últimas unidades";
        } else {
            disponibilidad.textContent = "Disponible";
        }

        const precioTotal = document.createElement("strong");
        precioTotal.textContent = formatoPrecio(importe);

        const precioUnitario = document.createElement("p");
        precioUnitario.className = "carrito-precio-unitario";

        if (descuento > 0) {
            precioUnitario.textContent =
                "Precio original: " + formatoPrecio(precioOriginal) +
                " | Descuento: " + descuento + "%" +
                " | Precio unitario: " + formatoPrecio(precioFinal);
        } else {
            precioUnitario.textContent =
                "Precio unitario: " + formatoPrecio(precioOriginal);
        }

        informacion.append(
            nombre,
            presentacion,
            disponibilidad,
            precioTotal,
            precioUnitario
        );

        const controles = document.createElement("div");
        controles.className = "carrito-controles";

        const etiqueta = document.createElement("label");
        etiqueta.textContent = "Cantidad";

        const contenedorCantidad = document.createElement("div");
        contenedorCantidad.className = "carrito-cantidad";

        const botonRestar = document.createElement("button");
        botonRestar.type = "button";
        botonRestar.textContent = "−";
        botonRestar.setAttribute("aria-label", "Disminuir cantidad");

        const cantidadTexto = document.createElement("span");
        cantidadTexto.textContent = item.cantidad;

        const botonSumar = document.createElement("button");
        botonSumar.type = "button";
        botonSumar.textContent = "+";
        botonSumar.setAttribute("aria-label", "Aumentar cantidad");

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "carrito-eliminar";
        botonEliminar.textContent = "Eliminar";

        contenedorCantidad.append(
            botonRestar,
            cantidadTexto,
            botonSumar
        );

        controles.append(
            etiqueta,
            contenedorCantidad,
            botonEliminar
        );

        // Aumentar la cantidad sin superar las existencias
        botonSumar.addEventListener("click", function () {
            if (item.cantidad >= Number(producto.stock)) {
                alert(
                    "Solo hay " + producto.stock +
                    " unidades disponibles."
                );
                return;
            }

            item.cantidad++;

            guardarCarrito();
            mostrarCarrito();
        });

        botonRestar.addEventListener("click", function () {
            if (item.cantidad > 1) {
                item.cantidad--;
            } else {
                carrito = carrito.filter(function (elemento) {
                    return elemento.id !== item.id;
                });
            }

            guardarCarrito();
            mostrarCarrito();
        });

        botonEliminar.addEventListener("click", function () {
            carrito = carrito.filter(function (elemento) {
                return elemento.id !== item.id;
            });

            guardarCarrito();
            mostrarCarrito();
        });

        articulo.append(
            contenedorImagen,
            informacion,
            controles
        );

        listaCarrito.appendChild(articulo);
    });

    const subtotal = calcularTotalRecursivo(carrito) / 100;

    carritoVacio.hidden = !colaVacia(carrito);

    cantidadProductos.textContent =
        unidades + (unidades === 1 ? " producto" : " productos");

    resumenCantidad.textContent = unidades;
    resumenSubtotal.textContent = formatoPrecio(subtotal);
    resumenTotal.textContent = formatoPrecio(subtotal);

    botonConfirmar.disabled =
        !carritoCargado || colaVacia(carrito);
}

// consultar la sesión
async function iniciarCarrito() {
    botonConfirmar.disabled = true;
    carritoAviso.textContent = "Cargando tu carrito...";

    try {
        // verificar que el usuario inició sesión
        const respuestaSesion = await fetch("../php/sesion.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuestaSesion.ok) {
            throw new Error("No se pudo consultar la sesión.");
        }

        const sesion = await respuestaSesion.json();

        if (!sesion.autenticado || !sesion.usuario) {
            carritoAviso.textContent =
                "Inicia sesión para consultar tus productos.";

            listaCarrito.innerHTML = "";
            carritoVacio.hidden = false;

            return;
        }

        // consultar base de datos
        const respuestaProductos = await fetch("../php/productos.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuestaProductos.ok) {
            throw new Error("No se pudo consultar el inventario.");
        }

        const datos = await respuestaProductos.json();

        if (!datos.exito || !Array.isArray(datos.productos)) {
            throw new Error("La respuesta de productos no es válida.");
        }

        productosBD = datos.productos;

        claveCarrito = "carrito_usuario_" + sesion.usuario.id;

        carrito = leerCarrito();
        carritoCargado = true;

        guardarCarrito();

        carritoAviso.textContent =
            "Carrito de " + sesion.usuario.nombre +
            ". Puedes modificar las cantidades o eliminar productos.";

        mostrarCarrito();

    } catch (error) {
        console.error("Error al cargar el carrito:", error);

        carritoAviso.textContent =
            "No se pudo cargar el carrito. " +
            "Revisa la conexión e intenta actualizar la página.";

        botonConfirmar.disabled = true;
    }
}

botonConfirmar.addEventListener("click", function () {
    if (!carritoCargado || claveCarrito === null) {
        alert("Necesitas iniciar sesión para continuar.");
        return;
    }

    if (colaVacia(carrito)) {
        alert("Tu carrito está vacío.");
        return;
    }

    window.location.href = "confirmar-pedido.html";
});

iniciarCarrito();
