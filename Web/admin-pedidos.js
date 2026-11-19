const listaPedidos = document.getElementById("listaPedidos");

        const buscarPedido = document.getElementById("buscarPedido");
        const filtroEstado = document.getElementById("filtroEstado");
        const limpiarFiltros = document.getElementById("limpiarFiltros");

        let pedidos = [];

        function formatoPrecio(precio) {
            return Number(precio).toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN"
            });
        }

        function formatoFecha(fecha) {

            const partes = String(fecha).split(" ");
            const numeros = partes[0].split("-");

            if (numeros.length !== 3) {
                return fecha;
            }

            return numeros[2] + "/" +
                   numeros[1] + "/" +
                   numeros[0] + " " +
                   (partes[1] || "").substring(0, 5);
        }

        function obtenerClaseEstado(estado) {

            switch (estado.toLowerCase()) {

                case "pendiente":
                    return "estado-pendiente";

                case "en preparación":
                    return "estado-preparacion";

                case "en camino":
                case "enviado":
                    return "estado-enviado";

                case "entregado":
                    return "estado-entregado";

                case "cancelado":
                    return "estado-cancelado";

                default:
                    return "estado-otro";
            }
        }

        // busqueda lineal
        function mostrarPedidos() {

            listaPedidos.innerHTML = "";

            const texto = buscarPedido.value.trim().toLowerCase();
            const estadoSeleccionado = filtroEstado.value;

            let encontrados = 0;

            pedidos.forEach(function (pedido) {

                const numero = String(pedido.id_pedido);
                const cliente = String(pedido.cliente).toLowerCase();

                // Buscar por número o por nombre del cliente
                const coincideTexto =
                    numero.includes(texto) ||
                    cliente.includes(texto);

                // Comparar el estado del pedido con el filtro
                const coincideEstado =
                    estadoSeleccionado === "todos" ||
                    pedido.estatus_pedido === estadoSeleccionado;

                if (!coincideTexto || !coincideEstado) {
                    return;
                }

                encontrados++;

                // Crear una fila para el pedido encontrado
                const fila = document.createElement("tr");

                const columnaNumero = document.createElement("td");
                columnaNumero.textContent = "#" + pedido.id_pedido;

                const columnaCliente = document.createElement("td");
                columnaCliente.textContent = pedido.cliente;

                const columnaFecha = document.createElement("td");
                columnaFecha.textContent = formatoFecha(
                    pedido.fecha_pedido
                );

                const columnaTotal = document.createElement("td");
                columnaTotal.textContent = formatoPrecio(pedido.total);

                const columnaEstado = document.createElement("td");

                const etiqueta = document.createElement("span");
                etiqueta.className = "pedido-estado " +
                    obtenerClaseEstado(pedido.estatus_pedido);

                etiqueta.textContent = pedido.estatus_pedido;

                columnaEstado.appendChild(etiqueta);

                const columnaAccion = document.createElement("td");

                const enlace = document.createElement("a");
                enlace.className = "pedido-boton";
                enlace.textContent = "Ver detalles";

                enlace.href =
                    "admin-detalle.html?id=" + pedido.id_pedido;

                columnaAccion.appendChild(enlace);

                fila.append(
                    columnaNumero,
                    columnaCliente,
                    columnaFecha,
                    columnaTotal,
                    columnaEstado,
                    columnaAccion
                );

                listaPedidos.appendChild(fila);
            });

            // Comprobar si la búsqueda no encontró pedidos
            if (encontrados === 0) {

                const fila = document.createElement("tr");
                const celda = document.createElement("td");

                celda.colSpan = 6;
                celda.textContent =
                    "No se encontraron pedidos con esos filtros.";

                fila.appendChild(celda);
                listaPedidos.appendChild(fila);
            }
        }

        // arreglos
        function actualizarResumen() {

            let pendientes = 0;
            let preparacion = 0;
            let enviados = 0;
            let entregados = 0;
            let cancelados = 0;

            pedidos.forEach(function (pedido) {

                switch (pedido.estatus_pedido.toLowerCase()) {

                    case "pendiente":
                        pendientes++;
                        break;

                    case "en preparación":
                        preparacion++;
                        break;

                    case "en camino":
                    case "enviado":
                        enviados++;
                        break;

                    case "entregado":
                        entregados++;
                        break;

                    case "cancelado":
                        cancelados++;
                        break;
                }
            });

            document.getElementById("totalPendientes").textContent =
                pendientes;

            document.getElementById("totalPreparacion").textContent =
                preparacion;

            document.getElementById("totalEnviados").textContent =
                enviados;

            document.getElementById("totalEntregados").textContent =
                entregados;

            document.getElementById("totalCancelados").textContent =
                cancelados;
        }

        async function cargarPedidos() {

            try {

                const respuesta = await fetch(
                    "../php/admin_pedidos.php",
                    {
                        credentials: "same-origin",
                        cache: "no-store"
                    }
                );

                // Impedir el acceso si no es administrador
                if (
                    respuesta.status === 401 ||
                    respuesta.status === 403
                ) {
                    window.location.replace("login.html");
                    return;
                }

                const datos = await respuesta.json();

                if (
                    !respuesta.ok ||
                    !datos.exito ||
                    !Array.isArray(datos.pedidos)
                ) {
                    throw new Error(
                        "No se pudieron consultar los pedidos."
                    );
                }

                pedidos = datos.pedidos;

                actualizarResumen();
                mostrarPedidos();

                document.body.classList.remove("admin-oculto");

            } catch (error) {

                console.error("Error al cargar pedidos:", error);

                listaPedidos.innerHTML = "";

                const fila = document.createElement("tr");
                const celda = document.createElement("td");

                celda.colSpan = 6;
                celda.textContent = error.message;

                fila.appendChild(celda);
                listaPedidos.appendChild(fila);

                document.body.classList.remove("admin-oculto");
            }
        }

        buscarPedido.addEventListener("input", mostrarPedidos);

        // Filtrar cuando se selecciona un estado
        filtroEstado.addEventListener("change", mostrarPedidos);

        limpiarFiltros.addEventListener("click", function () {

            buscarPedido.value = "";
            filtroEstado.value = "todos";

            mostrarPedidos();
        });

        cargarPedidos();
