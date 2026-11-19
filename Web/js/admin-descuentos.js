const lista = document.getElementById("listaDescuentos");

        function formatoPrecio(numero) {
            return Number(numero).toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN"
            });
        }

        async function cargarProductos() {
            try {
                const respuesta = await fetch(
                    "../php/admin_descuentos.php",
                    {
                        credentials: "same-origin",
                        cache: "no-store"
                    }
                );

                if (respuesta.status === 401 ||
                    respuesta.status === 403) {
                    window.location.replace("login.html");
                    return;
                }

                const datos = await respuesta.json();

                if (!respuesta.ok || !datos.exito) {
                    throw new Error("No se pudieron cargar los productos.");
                }

                lista.innerHTML = "";

                datos.productos.forEach(producto => {
                    const fila = document.createElement("tr");

                    const nombre = document.createElement("td");
                    nombre.textContent = producto.nombre;

                    const precio = document.createElement("td");
                    precio.textContent = formatoPrecio(
                        producto.precio_unitario
                    );

                    const columnaDescuento = document.createElement("td");

                    const input = document.createElement("input");
                    input.type = "number";
                    input.className = "descuento-input";
                    input.min = "0";
                    input.max = "100";
                    input.step = "0.01";
                    input.value = producto.descuento_porcentaje ?? 0;

                    columnaDescuento.appendChild(input);

                    const precioFinal = document.createElement("td");

                    function calcularPrecio() {
                        const porcentaje = Number(input.value);

                        if (input.value === "" ||
                            !Number.isFinite(porcentaje) ||
                            porcentaje < 0 ||
                            porcentaje > 100) {
                            precioFinal.textContent = "Descuento inválido";
                            return;
                        }

                        const final = Number(producto.precio_unitario) *
                            (1 - porcentaje / 100);

                        precioFinal.textContent = formatoPrecio(final);
                    }

                    input.addEventListener("input", calcularPrecio);

                    calcularPrecio();

                    const columnaAccion = document.createElement("td");

                    const boton = document.createElement("button");
                    boton.className = "descuento-guardar";
                    boton.textContent = "Guardar";

                    const mensaje = document.createElement("div");
                    mensaje.className = "descuento-mensaje";

                    boton.addEventListener("click", async () => {
                        const porcentaje = Number(input.value);

                        if (input.value === "" ||
                            !Number.isFinite(porcentaje) ||
                            porcentaje < 0 ||
                            porcentaje > 100) {
                            mensaje.textContent =
                                "Ingresa un descuento entre 0 y 100.";
                            return;
                        }

                        boton.disabled = true;
                        mensaje.textContent = "Guardando...";

                        try {
                            const respuesta = await fetch(
                                "../php/admin_descuentos.php",
                                {
                                    method: "POST",
                                    credentials: "same-origin",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        id_producto: producto.id_producto,
                                        descuento_porcentaje: porcentaje
                                    })
                                }
                            );

                            const datos = await respuesta.json();

                            if (!respuesta.ok || !datos.exito) {
                                throw new Error(
                                    datos.mensaje || "No se pudo guardar."
                                );
                            }

                            input.value = porcentaje.toFixed(2);
                            mensaje.textContent =
                                "Descuento guardado correctamente.";

                            calcularPrecio();

                        } catch (error) {
                            mensaje.textContent = error.message;
                        }

                        boton.disabled = false;
                    });

                    columnaAccion.appendChild(boton);
                    columnaAccion.appendChild(mensaje);

                    fila.appendChild(nombre);
                    fila.appendChild(precio);
                    fila.appendChild(columnaDescuento);
                    fila.appendChild(precioFinal);
                    fila.appendChild(columnaAccion);

                    lista.appendChild(fila);
                });

                document.body.classList.remove("admin-oculto");

            } catch (error) {
                lista.innerHTML = "";

                const fila = document.createElement("tr");
                const celda = document.createElement("td");

                celda.colSpan = 5;
                celda.textContent = error.message;

                fila.appendChild(celda);
                lista.appendChild(fila);

                document.body.classList.remove("admin-oculto");
            }
        }

        cargarProductos();
