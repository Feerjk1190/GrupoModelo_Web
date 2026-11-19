(function () {

    const formulario = document.getElementById("formConfirmacion");
    const contenedor = document.getElementById("confirmacionProductos");
    const subtotalTexto = document.getElementById("confirmacionSubtotal");
    const totalTexto = document.getElementById("confirmacionTotal");
    const mensaje = document.getElementById("confirmacionMensaje");

    const botonGuardar = document.getElementById("btnGuardarEntrega");
    const botonConfirmar = document.getElementById("btnConfirmarPedido");

    const campos = {
        nombre: document.getElementById("pedidoNombre"),
        telefono: document.getElementById("pedidoTelefono"),
        codigo_postal: document.getElementById("pedidoCodigoPostal"),
        direccion: document.getElementById("pedidoDireccion"),
        referencias: document.getElementById("pedidoReferencias")
    };

    let usuario = null;
    let productos = [];
    let carrito = [];

    let inventarioCorrecto = false;
    let entregaGuardada = false;
    let ocupada = false;

    // Dar formato de pesos mexicanos
    function moneda(valor) {
        return Number(valor).toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN"
        });
    }

    // Mostrar mensajes al cliente
    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = "confirmacion-mensaje " + tipo;
    }

    // Calcular el precio con el descuento guardado en MySQL
    function obtenerPrecioFinal(producto) {
        const precio = Number(producto.precio);
        const descuento =
            Number(producto.descuento_porcentaje) || 0;

        return Math.round(
            precio * (1 - descuento / 100) * 100
        ) / 100;
    }

    // RECURSIVIDAD: acumular el costo de los productos con descuento.
    // Caso base: no quedan productos por sumar.
    // Paso recursivo: sumar un producto y llamar de nuevo a la función.
    function calcularTotalRecursivo(items, indice = 0) {
        if (indice >= items.length) {
            return 0;
        }

        const item = items[indice];
        const producto = productos.find(function (p) {
            return Number(p.id) === Number(item.id);
        });

        const cantidad = Number(item.cantidad);
        const valido = producto && Number.isInteger(cantidad) && cantidad > 0;
        const importeCentavos = valido
            ? Math.round(obtenerPrecioFinal(producto) * 100) * cantidad
            : 0;

        return importeCentavos + calcularTotalRecursivo(items, indice + 1);
    }

    // Habilitar o deshabilitar los botones
    function actualizarBotones() {

        botonGuardar.disabled = !usuario || ocupada;

        botonConfirmar.disabled =
            !usuario ||
            !inventarioCorrecto ||
            !entregaGuardada ||
            ocupada;

        botonGuardar.textContent = ocupada
            ? "PROCESANDO..."
            : "GUARDAR DATOS DE ENTREGA";

        botonConfirmar.textContent = ocupada
            ? "PROCESANDO..."
            : "CONFIRMAR PEDIDO";
    }

    // Leer los datos escritos en el formulario
    function leerDatosEntrega() {

        const datos = {
            nombre: campos.nombre.value.trim(),
            telefono: campos.telefono.value.trim(),
            codigo_postal: campos.codigo_postal.value.trim(),
            direccion: campos.direccion.value.trim(),
            referencias: campos.referencias.value.trim()
        };

        // Validar campos obligatorios
        if (
            !datos.nombre ||
            !datos.telefono ||
            !datos.codigo_postal ||
            !datos.direccion
        ) {
            mostrarMensaje("Completa los datos obligatorios.");
            return null;
        }

        // Validar teléfono de 10 dígitos
        if (!/^[0-9]{10}$/.test(datos.telefono)) {
            mostrarMensaje("El teléfono debe tener 10 dígitos.");
            return null;
        }

        // Validar código postal de 5 dígitos
        if (!/^[0-9]{5}$/.test(datos.codigo_postal)) {
            mostrarMensaje("El código postal debe tener 5 dígitos.");
            return null;
        }

        if (
            datos.nombre.length > 100 ||
            datos.direccion.length > 150 ||
            datos.referencias.length > 200
        ) {
            mostrarMensaje("Uno de los campos tiene demasiado texto.");
            return null;
        }

        return datos;
    }

    // Colocar datos de entrega guardados anteriormente
    function rellenarCampos(datos) {

        if (!datos) {
            return;
        }

        campos.nombre.value = datos.nombre || "";
        campos.telefono.value = datos.telefono || "";
        campos.codigo_postal.value = datos.codigo_postal || "";
        campos.direccion.value = datos.direccion || "";

        campos.referencias.value =
            datos.referencias === "Sin referencias"
                ? ""
                : (datos.referencias || "");
    }

    // Si se cambia un campo, hay que guardar otra vez
    Object.values(campos).forEach(function (campo) {

        campo.addEventListener("input", function () {
            entregaGuardada = false;
            actualizarBotones();
        });

    });

    // Mostrar aviso cuando el teléfono tiene más de 10 dígitos
    const errorTelefono = document.createElement("small");

    errorTelefono.style.color = "red";
    errorTelefono.style.fontSize = "12px";
    errorTelefono.style.display = "none";

    campos.telefono.insertAdjacentElement(
        "afterend",
        errorTelefono
    );

    campos.telefono.addEventListener("input", function () {

        if (campos.telefono.value.trim().length > 10) {
            errorTelefono.textContent =
                "El teléfono no puede tener más de 10 dígitos.";

            errorTelefono.style.display = "block";
        } else {
            errorTelefono.textContent = "";
            errorTelefono.style.display = "none";
        }

    });

    // Mostrar aviso cuando el código postal tiene más de 5 dígitos
    const errorCodigoPostal = document.createElement("small");

    errorCodigoPostal.style.color = "red";
    errorCodigoPostal.style.fontSize = "12px";
    errorCodigoPostal.style.display = "none";

    campos.codigo_postal.insertAdjacentElement(
        "afterend",
        errorCodigoPostal
    );

    campos.codigo_postal.addEventListener("input", function () {

        if (campos.codigo_postal.value.trim().length > 5) {
            errorCodigoPostal.textContent =
                "El código postal no puede tener más de 5 dígitos.";

            errorCodigoPostal.style.display = "block";
        } else {
            errorCodigoPostal.textContent = "";
            errorCodigoPostal.style.display = "none";
        }

    });

    // Mostrar el resumen de productos y calcular el total
    function mostrarResumen() {

        contenedor.innerHTML = "";

        let unidades = 0;
        let errorInventario = false;

        // Comprobar si el arreglo del carrito está vacío
        if (carrito.length === 0) {

            contenedor.textContent = "Tu carrito está vacío.";

            subtotalTexto.textContent = moneda(0);
            totalTexto.textContent = moneda(0);

            inventarioCorrecto = false;
            actualizarBotones();

            return;
        }

        // CONJUNTOS: evitar identificadores repetidos
        const idsVistos = new Set();

        // ARREGLOS: recorrer cada producto del carrito
        carrito.forEach(function (item) {

            const id = Number(item.id);
            const cantidad = Number(item.cantidad);

            // BÚSQUEDA LINEAL: encontrar el producto por ID
            const producto = productos.find(function (p) {
                return Number(p.id) === id;
            });

            // Comprobar cantidad, existencias y duplicados
            if (
                !producto ||
                idsVistos.has(id) ||
                !Number.isInteger(cantidad) ||
                cantidad < 1 ||
                cantidad > Number(producto.stock) ||
                producto.estatus === "Agotado"
            ) {
                errorInventario = true;
                return;
            }

            idsVistos.add(id);

            const precioOriginal = Number(producto.precio);
            const descuento =
                Number(producto.descuento_porcentaje) || 0;

            const precioFinal = obtenerPrecioFinal(producto);

            // Multiplicar precio rebajado por cantidad
            const importe = Math.round(
                precioFinal * cantidad * 100
            ) / 100;

            unidades += cantidad;

            // Crear la fila que representa al producto
            const fila = document.createElement("div");
            fila.className = "confirmacion-producto-item";

            const imagen = document.createElement("img");
            imagen.src =
                "../img/" + encodeURIComponent(producto.imagen);
            imagen.alt = producto.nombre;

            const informacion = document.createElement("div");
            informacion.className = "confirmacion-producto-info";

            const nombre = document.createElement("strong");
            nombre.textContent = producto.nombre;

            const presentacion = document.createElement("p");
            presentacion.textContent = producto.presentacion;

            const cantidadTexto = document.createElement("span");
            cantidadTexto.textContent = "Cantidad: " + cantidad;

            const precioUnitario = document.createElement("p");

            if (descuento > 0) {
                precioUnitario.textContent =
                    "Antes: " + moneda(precioOriginal) +
                    " | Descuento: " + descuento + "%" +
                    " | Ahora: " + moneda(precioFinal);
            } else {
                precioUnitario.textContent =
                    "Precio unitario: " + moneda(precioFinal);
            }

            const precio = document.createElement("strong");
            precio.className = "confirmacion-producto-precio";
            precio.textContent = moneda(importe);

            informacion.append(
                nombre,
                presentacion,
                cantidadTexto,
                precioUnitario
            );

            fila.append(
                imagen,
                informacion,
                precio
            );

            contenedor.appendChild(fila);
        });

        const subtotal = calcularTotalRecursivo(carrito) / 100;

        subtotalTexto.textContent = moneda(subtotal);
        totalTexto.textContent = moneda(subtotal);

        inventarioCorrecto =
            !errorInventario && unidades > 0;

        if (errorInventario) {
            mostrarMensaje(
                "Hay productos o cantidades incorrectas. " +
                "Revisa tu carrito."
            );
        }

        actualizarBotones();
    }

    // Recuperar los datos de entrega desde PHP y MySQL
    async function cargarEntrega() {

        const respuesta = await fetch("../php/obtener_entrega.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                resultado.mensaje ||
                "No se pudieron consultar los datos de entrega."
            );
        }

        if (resultado.encontrado && resultado.entrega) {
            rellenarCampos(resultado.entrega);
            entregaGuardada = true;
        } else {
            campos.nombre.value = usuario.nombre || "";
            entregaGuardada = false;
        }

        actualizarBotones();
    }

    // Cargar sesión, productos, descuentos y carrito
    async function cargarPagina() {

        actualizarBotones();

        try {

            const respuestaSesion = await fetch("../php/sesion.php", {
                credentials: "same-origin",
                cache: "no-store"
            });

            if (!respuestaSesion.ok) {
                throw new Error("No se pudo consultar la sesión.");
            }

            const sesion = await respuestaSesion.json();

            if (!sesion.autenticado || !sesion.usuario) {
                mostrarMensaje("Necesitas iniciar sesión.");
                contenedor.textContent =
                    "Inicia sesión para continuar.";
                return;
            }

            usuario = sesion.usuario;
            actualizarBotones();

            try {
                await cargarEntrega();
            } catch (error) {
                console.error("Error al cargar entrega:", error);
                mostrarMensaje(error.message);
            }

            // Consultar precios reales y descuentos de MySQL
            const respuestaProductos = await fetch(
                "../php/productos.php",
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            if (!respuestaProductos.ok) {
                throw new Error("No se pudo consultar el inventario.");
            }

            const datos = await respuestaProductos.json();

            if (!datos.exito || !Array.isArray(datos.productos)) {
                throw new Error("El inventario no es válido.");
            }

            productos = datos.productos;

            // Cada usuario tiene su propio carrito
            const claveCarrito =
                "carrito_usuario_" + usuario.id;

            const guardado = JSON.parse(
                localStorage.getItem(claveCarrito) || "[]"
            );

            if (!Array.isArray(guardado)) {
                throw new Error("El carrito no es válido.");
            }

            carrito = guardado;

            mostrarResumen();

            if (inventarioCorrecto) {
                mostrarMensaje(
                    "Revisa tus productos y guarda los datos " +
                    "de entrega antes de confirmar.",
                    "info"
                );
            }

        } catch (error) {

            console.error("Error al cargar la página:", error);

            contenedor.textContent =
                "No se pudo cargar el resumen del pedido.";

            mostrarMensaje(
                "No se pudieron consultar los datos de la compra."
            );

            inventarioCorrecto = false;
            actualizarBotones();
        }
    }

    // Guardar los datos de entrega del cliente
    botonGuardar.addEventListener("click", async function () {

        if (!usuario || ocupada) {
            return;
        }

        const datos = leerDatosEntrega();

        if (!datos) {
            return;
        }

        ocupada = true;
        actualizarBotones();

        try {

            const respuesta = await fetch("../php/guardar_entrega.php", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudieron guardar los datos."
                );
            }

            entregaGuardada = true;

            mostrarMensaje(
                "Datos de entrega guardados correctamente.",
                "exito"
            );

        } catch (error) {

            console.error("Error al guardar la entrega:", error);
            mostrarMensaje(error.message);

        } finally {

            ocupada = false;
            actualizarBotones();
        }
    });

    // Registrar el pedido real mediante PHP
    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        if (ocupada || !usuario) {
            return;
        }

        if (!inventarioCorrecto || carrito.length === 0) {
            mostrarMensaje("Revisa los productos de tu carrito.");
            return;
        }

        if (!entregaGuardada) {
            mostrarMensaje(
                "Primero debes guardar tus datos de entrega."
            );
            return;
        }

        const entrega = leerDatosEntrega();

        if (!entrega) {
            return;
        }

        // Evitar que el usuario envíe el pedido varias veces
        const clavePendiente =
            "gm_pedido_pendiente_" + usuario.id;

        let claveSolicitud =
            sessionStorage.getItem(clavePendiente);

        // Crear un identificador único para esta compra
        if (!claveSolicitud) {
            claveSolicitud = crypto.randomUUID().replace(/-/g, "");
            sessionStorage.setItem(
                clavePendiente,
                claveSolicitud
            );
        }

        ocupada = true;
        actualizarBotones();

        mostrarMensaje("Registrando tu pedido...", "info");

        try {

            // Enviar productos y datos de entrega al servidor
            const respuesta = await fetch("../php/crear_pedido.php", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...entrega,
                    clave_solicitud: claveSolicitud,
                    productos: carrito.map(function (item) {
                        return {
                            id: Number(item.id),
                            cantidad: Number(item.cantidad)
                        };
                    })
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudo registrar el pedido."
                );
            }

            // La compra ya fue confirmada por MySQL
            const claveCarrito =
                "carrito_usuario_" + usuario.id;

            localStorage.removeItem(claveCarrito);
            sessionStorage.removeItem(clavePendiente);

            carrito = [];
            inventarioCorrecto = false;

            mostrarMensaje(
                "Pedido #" + resultado.id_pedido +
                " registrado correctamente. Total: " +
                moneda(resultado.total),
                "exito"
            );

            mostrarResumen();

            // Mostrar el historial de compras
            window.location.href = "compras.html";

        } catch (error) {

            console.error("Error al confirmar pedido:", error);

            mostrarMensaje(
                error.message +
                " Si no estás segura de que se registró, " +
                "revisa Mis compras antes de volver a intentarlo."
            );

        } finally {

            ocupada = false;
            actualizarBotones();
        }
    });

    actualizarBotones();
    cargarPagina();

})();
