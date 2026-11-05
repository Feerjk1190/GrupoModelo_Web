const contenedorProductos = document.getElementById("listaProductos");
const campoBuscar = document.getElementById("buscarProducto");
const selectorOrden = document.getElementById("ordenPrecio");
const botonesCategoria = document.querySelectorAll(".opcionCategoria");
const botonVerMas = document.getElementById("verMas");

let categoriaActual = "todos";
let limiteProductos = 8;

const ordenInicial = productos.map(function (producto) {
  return producto.nombre;
});

function mostrarProductos() {
  let encontrados = 0;
  contenedorProductos.innerHTML = "";
  const textoBusqueda = campoBuscar.value.toLowerCase().trim();

  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    const coincideNombre = producto.nombre.toLowerCase().includes(textoBusqueda);
    const coincideCategoria =
      categoriaActual === "todos" ||
      categoriaActual === "cervezas" ||
      categoriaActual === producto.categoria ||
      (categoriaActual === "promociones" && producto.oferta);

    if (!coincideNombre || !coincideCategoria) continue;

    encontrados++;
    if (encontrados > limiteProductos) continue;

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjetaProducto";
    tarjeta.innerHTML = `
      <div class="imagenProducto">
        <img src="${producto.imagen}" alt="${producto.nombre}">
      </div>
      <div class="informacionProducto">
        <h4>${producto.nombre}</h4>
        <p class="descripcionPaquete">${producto.presentacion}</p>
        <p class="textoDisponibilidad">Stock: ${producto.stock}</p>
        <strong class="precioProducto">$${producto.precio}</strong>
      </div>
    `;

    contenedorProductos.appendChild(tarjeta);
  }

  botonVerMas.hidden = encontrados <= limiteProductos;
}

campoBuscar.addEventListener("input", function () {
  limiteProductos = 8;
  mostrarProductos();
});

botonesCategoria.forEach(function (boton) {
  boton.addEventListener("click", function () {
    botonesCategoria.forEach(function (b) {
      b.classList.remove("categoriaActiva");
    });
    boton.classList.add("categoriaActiva");
    categoriaActual = boton.dataset.filtro;
    limiteProductos = 8;
    mostrarProductos();
  });
});

selectorOrden.addEventListener("change", function () {
  if (selectorOrden.value === "normal") {
    productos.sort(function (a, b) {
      return ordenInicial.indexOf(a.nombre) - ordenInicial.indexOf(b.nombre);
    });
  } else {
    for (let i = 0; i < productos.length - 1; i++) {
      for (let j = 0; j < productos.length - 1 - i; j++) {
        const debeCambiar =
          selectorOrden.value === "menor"
            ? productos[j].precio > productos[j + 1].precio
            : productos[j].precio < productos[j + 1].precio;

        if (debeCambiar) {
          const temporal = productos[j];
          productos[j] = productos[j + 1];
          productos[j + 1] = temporal;
        }
      }
    }
  }
  limiteProductos = 8;
  mostrarProductos();
});

botonVerMas.addEventListener("click", function () {
  limiteProductos += 8;
  mostrarProductos();
});

mostrarProductos();
