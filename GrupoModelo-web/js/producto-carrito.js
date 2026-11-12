    const botonCarrito = document.getElementById("detalleAgregar");
    const ventanaLogin = document.getElementById("modalLogin");
    const botonCerrar = document.getElementById("cerrarModal");
    const botonCancelar = document.getElementById("cancelarModal");

    // Comprobar sesión al presionar Agregar al carrito
    botonCarrito.addEventListener("click", async function () {

        try {

            const respuesta = await fetch("../php/sesion.php", {
                credentials: "same-origin",
                cache: "no-store"
            });

            if (!respuesta.ok) {
                throw new Error("No se pudo verificar la sesión");
            }

            const datos = await respuesta.json();

            
if (datos.autenticado) {

    // Obtener el ID del producto desde la URL
    const parametros = new URLSearchParams(window.location.search);
    const idProducto = Number(parametros.get("id"));

    // Buscar el producto en nuestro arreglo
    
    const producto = productoSeleccionado;


    if (!producto) {
        alert("No se encontró el producto.");
        return;
    }

    // Obtener y validar la cantidad seleccionada
    const campoCantidad = document.getElementById("detalleCantidad");
    const cantidad = Number(campoCantidad.value);

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert("Selecciona una cantidad válida.");
        return;
    }

    if (cantidad > producto.stock) {
        alert("La cantidad supera el stock disponible.");
        return;
    }

    const claveCarrito = "carrito_usuario_" + datos.usuario.id;

    // Recuperar los productos guardados
    let carrito = JSON.parse(
        localStorage.getItem(claveCarrito) || "[]"
    );

    // Buscar si el producto ya está en el carrito
    const existente = carrito.find(function (item) {
        return item.id === idProducto;
    });

    const cantidadActual = existente ? existente.cantidad : 0;

    // Validar el stock considerando lo que ya se agregó
    if (cantidadActual + cantidad > producto.stock) {
        alert(
            "No puedes agregar más de " +
            producto.stock +
            " unidades de este producto."
        );
        return;
    }

    if (existente) {

        // Si ya existe, aumentar su cantidad
        existente.cantidad += cantidad;

    } else {

        // Si no existe, agregarlo al arreglo
        carrito.push({
            id: idProducto,
            cantidad: cantidad
        });

    }

    // Guardar el carrito en el navegador
    localStorage.setItem(
        claveCarrito,
        JSON.stringify(carrito)
    );

    alert("¡Producto agregado al carrito!");

} else {

    ventanaLogin.classList.add("activo");

}


        } catch (error) {

            console.error("Error de sesión:", error);

            alert(
                "No se pudo comprobar tu sesión. " +
                "Inténtalo nuevamente."
            );

        }

    });

    botonCerrar.addEventListener("click", function () {
        ventanaLogin.classList.remove("activo");
    });

    botonCancelar.addEventListener("click", function () {
        ventanaLogin.classList.remove("activo");
    });

    ventanaLogin.addEventListener("click", function (evento) {
        if (evento.target === ventanaLogin) {
            ventanaLogin.classList.remove("activo");
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            ventanaLogin.classList.remove("activo");
        }
    });
