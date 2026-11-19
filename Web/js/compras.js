const listaCompras = document.getElementById("listaCompras");
const comprasMensaje = document.getElementById("comprasMensaje");

function formatoMoneda(valor) {
    return Number(valor).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

function formatoFecha(fecha) {
    const fechaValida = new Date(fecha.replace(" ", "T"));

    if (Number.isNaN(fechaValida.getTime())) {
        return fecha;
    }

    return fechaValida.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// Crear los productos de cada pedido
function crearProductoCompra(producto) {

    const fila = document.createElement("div");
    fila.className = "compras-producto-item";

    const imagen = document.createElement("img");
    imagen.src = "../img/" + encodeURIComponent(producto.imagen || "");
    imagen.alt = producto.nombre;

    const informacion = document.createElement("div");
    informacion.className = "compras-producto-info";

    const nombre = document.createElement("strong");
    nombre.textContent = producto.nombre;

    const detalles = document.createElement("p");
    detalles.textContent =
        producto.presentacion + " | Cantidad: " + producto.cantidad;

    const precio = document.createElement("strong");
    precio.className = "compras-producto-precio";
    precio.textContent = formatoMoneda(producto.subtotal);

    informacion.append(nombre, detalles);
    fila.append(imagen, informacion, precio);

    return fila;
}

// Crear la tarjeta de un pedido
function crearTarjetaCompra(pedido) {

    const tarjeta = document.createElement("article");
    tarjeta.className = "compras-pedido";

    const encabezado = document.createElement("div");
    encabezado.className = "compras-pedido-encabezado";

    const datos = document.createElement("div");

    const titulo = document.createElement("h3");
    titulo.textContent = "Pedido #" + pedido.id_pedido;

    const fecha = document.createElement("p");
    fecha.textContent = formatoFecha(pedido.fecha_pedido);

    datos.append(titulo, fecha);

    const estado = document.createElement("span");
    estado.className = "compras-estado";
    estado.textContent = pedido.estatus;

    encabezado.append(datos, estado);

    const productos = document.createElement("div");
    productos.className = "compras-pedido-productos";

    if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {

        pedido.productos.forEach(function (producto) {
            productos.appendChild(crearProductoCompra(producto));
        });

    } else {
        const aviso = document.createElement("p");
        aviso.textContent = "Sin detalles disponibles.";
        productos.appendChild(aviso);
    }

    const pie = document.createElement("div");
    pie.className = "compras-pedido-total";

    const etiquetaTotal = document.createElement("span");
    etiquetaTotal.textContent = "Total del pedido";

    const total = document.createElement("strong");
    total.textContent = formatoMoneda(pedido.total);

    pie.append(etiquetaTotal, total);

    tarjeta.append(encabezado, productos, pie);

    return tarjeta;
}

// Consultar historial desde MySQL
async function cargarCompras() {

    listaCompras.innerHTML = "";
    comprasMensaje.hidden = true;

    const cargando = document.createElement("p");
    cargando.textContent = "Cargando tus pedidos...";
    listaCompras.appendChild(cargando);

    try {

        const respuesta = await fetch("../php/mis_compras.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No se pudieron consultar tus compras."
            );
        }

        listaCompras.innerHTML = "";

        if (!Array.isArray(datos.pedidos) || datos.pedidos.length === 0) {
            comprasMensaje.hidden = false;
            return;
        }

        datos.pedidos.forEach(function (pedido) {
            listaCompras.appendChild(crearTarjetaCompra(pedido));
        });

    } catch (error) {

        console.error("Error al cargar compras:", error);

        listaCompras.innerHTML = "";

        const aviso = document.createElement("p");
        aviso.textContent = error.message;
        listaCompras.appendChild(aviso);
    }
}

cargarCompras();
