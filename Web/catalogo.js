const buscar = document.getElementById("buscarProducto");
const categorias = document.querySelectorAll(".cat-item");
const ordenar = document.getElementById("ordenPrecio");
const cuadricula = document.querySelector(".grid-productos-app");
const tarjetas = Array.from(document.querySelectorAll(".card-horizontal"));

let categoria = "todos";
let limite = 8;
let masVendidos = [];

const seccionDestacados = document.getElementById("productosDestacados");

if (seccionDestacados) {
    seccionDestacados.remove();
}

function formatoPrecio(precio) {
    return Number(precio).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

function etiquetaDisponibilidad(stock, estatus) {
    if (Number(stock) <= 0 || estatus === "Agotado") {
        return { texto: "Agotado", clase: "agotado" };
    }

    if (Number(stock) <= 10) {
        return { texto: "Últimas unidades", clase: "bajo" };
    }

    return { texto: "Disponible", clase: "disponible" };
}

function mostrarDisponibilidad(tarjeta, producto) {
    const estado = etiquetaDisponibilidad(
        producto.stock,
        producto.estatus
    );

    let etiqueta = tarjeta.querySelector(".indicador-stock");

    if (!etiqueta) {
        etiqueta = document.createElement("span");

        const stock = tarjeta.querySelector(".stock-text");
        stock.insertAdjacentElement("afterend", etiqueta);
    }

    etiqueta.className = "indicador-stock " + estado.clase;
    etiqueta.textContent = estado.texto;
}

function mostrarDescuento(tarjeta, producto) {
    const precio = Number(producto.precio);
    const descuento = Number(producto.descuento_porcentaje) || 0;

    const precioFinal = precio - (precio * descuento / 100);

    const contenedorPrecio = tarjeta.querySelector(".precio-row");
    const contenedorImagen = tarjeta.querySelector(".card-img-col");

    contenedorPrecio.replaceChildren();

    const etiquetaAnterior = contenedorImagen.querySelector(".badge-oferta");

    if (etiquetaAnterior) {
        etiquetaAnterior.remove();
    }

    if (descuento > 0) {
        const precioOriginal = document.createElement("span");

        precioOriginal.textContent = formatoPrecio(precio);
        precioOriginal.style.textDecoration = "line-through";
        precioOriginal.style.color = "#64748b";
        precioOriginal.style.fontSize = "14px";
        precioOriginal.style.marginRight = "10px";

        const precioDescuento = document.createElement("span");

        precioDescuento.className = "precio-actual";
        precioDescuento.textContent = formatoPrecio(precioFinal);
        precioDescuento.style.color = "#dc2626";

        const etiquetaOferta = document.createElement("span");

        etiquetaOferta.className = "badge-oferta";
        etiquetaOferta.textContent = "-" + descuento + "%";

        contenedorPrecio.appendChild(precioOriginal);
        contenedorPrecio.appendChild(precioDescuento);
        contenedorImagen.appendChild(etiquetaOferta);

        tarjeta.dataset.oferta = "si";
        tarjeta.dataset.precio = precioFinal;

    } else {
        const precioNormal = document.createElement("span");

        precioNormal.className = "precio-actual";
        precioNormal.textContent = formatoPrecio(precio);

        contenedorPrecio.appendChild(precioNormal);

        tarjeta.dataset.oferta = "no";
        tarjeta.dataset.precio = precio;
    }
}

const zonaMas = document.createElement("div");
zonaMas.className = "contenedor-ver-mas";

const botonMas = document.createElement("button");
botonMas.className = "boton-ver-mas";
botonMas.type = "button";
botonMas.textContent = "Ver más productos ↓";

zonaMas.appendChild(botonMas);
cuadricula.appendChild(zonaMas);

function filtrarProductos() {
    const texto = buscar.value.trim().toLowerCase();

    let encontrados = 0;

    cuadricula.querySelectorAll(".card-horizontal").forEach(tarjeta => {
        const nombre = tarjeta.querySelector("h4").textContent.toLowerCase();
        const id = Number(tarjeta.dataset.id);

        const coincide = nombre.includes(texto) && (
            categoria === "todos" ||
            categoria === "cervezas" ||
            tarjeta.dataset.categoria === categoria ||
            (categoria === "promociones" && tarjeta.dataset.oferta === "si") ||
            (categoria === "destacados" && masVendidos.includes(id))
        );

        if (coincide) {
            encontrados++;
        }

        tarjeta.style.display =
            coincide && encontrados <= limite ? "" : "none";
    });

    zonaMas.hidden = encontrados <= limite;
    cuadricula.appendChild(zonaMas);
}

function ordenarProductos() {
    const lista = [...tarjetas];
    const modo = ordenar.value;

    if (modo !== "normal") {
        for (let i = 0; i < lista.length - 1; i++) {
            for (let j = 0; j < lista.length - 1 - i; j++) {

                const a = Number(lista[j].dataset.precio || 0);
                const b = Number(lista[j + 1].dataset.precio || 0);

                if (
                    (modo === "menor" && a > b) ||
                    (modo === "mayor" && a < b)
                ) {
                    [lista[j], lista[j + 1]] =
                        [lista[j + 1], lista[j]];
                }
            }
        }

    } else if (categoria === "destacados") {
        lista.sort((a, b) => {
            const ia = masVendidos.indexOf(Number(a.dataset.id));
            const ib = masVendidos.indexOf(Number(b.dataset.id));

            return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        });
    }

    lista.forEach(tarjeta => {
        cuadricula.appendChild(tarjeta);
    });

    filtrarProductos();
}

buscar.addEventListener("input", () => {
    limite = 8;
    filtrarProductos();
});

categorias.forEach(boton => {
    boton.addEventListener("click", () => {
        categorias.forEach(b => {
            b.classList.remove("active-cat");
        });

        boton.classList.add("active-cat");

        categoria = boton.dataset.filtro;
        limite = 8;

        ordenarProductos();
    });
});

ordenar.addEventListener("change", () => {
    limite = 8;
    ordenarProductos();
});

botonMas.addEventListener("click", () => {
    limite += 8;
    filtrarProductos();
});

async function actualizarCatalogoDesdeBD() {
    try {
        const respuesta = await fetch("../php/productos.php", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el catálogo");
        }

        const datos = await respuesta.json();

        if (!datos.exito || !Array.isArray(datos.productos)) {
            throw new Error("Datos no válidos");
        }

        datos.productos.forEach(producto => {
            const tarjeta = tarjetas.find(
                t => Number(t.dataset.id) === Number(producto.id)
            );

            if (!tarjeta) {
                return;
            }

            tarjeta.querySelector("h4").textContent = producto.nombre;

            tarjeta.querySelector(".desc-pack").textContent =
                producto.presentacion;

            tarjeta.querySelector(".stock-text").textContent =
                "Stock: " + producto.stock;

            const foto = tarjeta.querySelector(".card-img-col img");

            if (producto.imagen) {
                foto.src = "../img/" + encodeURIComponent(producto.imagen);
            }

            foto.alt = producto.nombre;

            tarjeta.dataset.categoria = producto.categoria;

            mostrarDisponibilidad(tarjeta, producto);
            mostrarDescuento(tarjeta, producto);
        });

        ordenarProductos();

    } catch (error) {
        console.error("No se pudo actualizar el catálogo:", error);
    }
}

async function cargarMasVendidos() {
    try {
        const respuesta = await fetch("../php/mas_vendidos.php", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar las ventas");
        }

        const datos = await respuesta.json();

        if (!datos.exito || !Array.isArray(datos.ids)) {
            throw new Error("Datos incorrectos");
        }

        masVendidos = datos.ids.map(Number);

        if (categoria === "destacados") {
            ordenarProductos();
        }

    } catch (error) {
        console.error("No se pudieron cargar los más vendidos:", error);
    }
}

filtrarProductos();
actualizarCatalogoDesdeBD();
cargarMasVendidos();
