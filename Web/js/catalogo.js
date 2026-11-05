const zona = document.getElementById("listaProductos");
const buscar = document.getElementById("buscarProducto");
const ordenar = document.getElementById("ordenPrecio");
const botones = document.querySelectorAll(".cat-item");
const verMas = document.getElementById("verMas");
let categoria = "todos";
let limite = 8;

function mostrar() {
    let encontrados = 0;
    zona.innerHTML = "";
    const texto = buscar.value.toLowerCase().trim();

    for (let i = 0; i < productos.length; i++) {
        const p = productos[i];
        const nombreCoincide = p.nombre.toLowerCase().includes(texto);
        const categoriaCoincide = categoria === "todos" || categoria === "cervezas" ||
            categoria === p.categoria || (categoria === "promociones" && p.oferta);

        if (!nombreCoincide || !categoriaCoincide) continue;
        encontrados++;
        if (encontrados > limite) continue;

        const tarjeta = document.createElement("article");
        tarjeta.className = "card-horizontal";
        tarjeta.innerHTML = '<div class="card-img-col"><img></div>' +
            '<div class="card-info-col"><h4></h4><p class="desc-pack"></p>' +
            '<p class="stock-text"></p><strong class="precio-actual"></strong></div>';
        tarjeta.querySelector("img").src = p.imagen;
        tarjeta.querySelector("img").alt = p.nombre;
        tarjeta.querySelector("h4").textContent = p.nombre;
        tarjeta.querySelector(".desc-pack").textContent = p.presentacion;
        tarjeta.querySelector(".stock-text").textContent = "Stock: " + p.stock;
        tarjeta.querySelector(".precio-actual").textContent = "$" + p.precio;
        zona.appendChild(tarjeta);
    }
    verMas.hidden = encontrados <= limite;
}

buscar.addEventListener("input", function () {
    limite = 8;
    mostrar();
});

botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
        botones.forEach(function (b) { b.classList.remove("active-cat"); });
        boton.classList.add("active-cat");
        categoria = boton.dataset.filtro;
        limite = 8;
        mostrar();
    });
});

ordenar.addEventListener("change", function () {
    if (ordenar.value === "normal") {
        productos.sort(function (a, b) { return ordenInicial.indexOf(a.nombre) - ordenInicial.indexOf(b.nombre); });
    } else {
        // Ordenamiento burbuja
        for (let i = 0; i < productos.length - 1; i++) {
            for (let j = 0; j < productos.length - 1 - i; j++) {
                const cambiar = ordenar.value === "menor"
                    ? productos[j].precio > productos[j + 1].precio
                    : productos[j].precio < productos[j + 1].precio;
                if (cambiar) {
                    const temporal = productos[j];
                    productos[j] = productos[j + 1];
                    productos[j + 1] = temporal;
                }
            }
        }
    }
    limite = 8;
    mostrar();
});

verMas.addEventListener("click", function () {
    limite += 8;
    mostrar();
});

const ordenInicial = productos.map(function (p) { return p.nombre; });
mostrar();
