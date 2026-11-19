async function iniciarNavegacion() {

    const menu = document.getElementById("navSesion");
    const menuPrincipal = document.querySelector(".header-app .nav-app");

    if (!menuPrincipal) {
        return;
    }

    // Identificar la sección actual y resaltar su opción de navegación.
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";

    const seccionesActivas = {
        "index.html": "index.html",
        "catalogo.html": "catalogo.html",
        "producto.html": "catalogo.html",
        "contacto.html": "contacto.html",
        "quienes-somos.html": "quienes-somos.html",
        "compras.html": "compras.html",
        "carrito.html": "carrito.html",
        "confirmar-pedido.html": "carrito.html"
    };

    const destinoActivo = seccionesActivas[paginaActual];

    menuPrincipal.querySelectorAll("a[href]").forEach(function (enlace) {
        const destino = enlace.getAttribute("href");

        if (destinoActivo && destino === destinoActivo) {
            enlace.classList.add("nav-item-activo");
            enlace.setAttribute("aria-current", "page");
        } else {
            enlace.classList.remove("nav-item-activo");
            enlace.removeAttribute("aria-current");
        }
    });

    if (!menu) {
        return;
    }

    try {

        // Consultar quién inició sesión.
        const respuesta = await fetch("../php/sesion.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar la sesión.");
        }

        const sesion = await respuesta.json();

        // Si no hay sesión, conservar el menú de visitante.
        if (!sesion.autenticado || !sesion.usuario) {
            return;
        }

        // Limpiar las opciones que se generan según la sesión.
        menu.innerHTML = "";

        const nombreCompleto =
            sesion.usuario.nombre ||
            sesion.usuario.nombre_completo ||
            sesion.usuario.nombre_usuario ||
            "Usuario";

        const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || "Usuario";

        // Para clientes, el saludo abre el perfil combinado con el historial.
        if (sesion.usuario.rol === "Administrador") {

            const saludo = document.createElement("span");
            saludo.className = "nav-item nav-saludo";
            saludo.textContent = "Hola, " + primerNombre;
            menu.appendChild(saludo);

            const panel = document.createElement("a");
            panel.href = "admin.html";
            panel.className = "btn-app btn-yellow";
            panel.textContent = "Panel de administración";
            menu.appendChild(panel);

        } else {

            const perfil = document.createElement("a");
            perfil.href = "compras.html";
            perfil.className = "nav-item nav-saludo";
            perfil.textContent = "Hola, " + primerNombre;
            perfil.title = "Ver mi perfil y mis compras";

            if (paginaActual === "compras.html") {
                perfil.classList.add("nav-item-activo");
                perfil.setAttribute("aria-current", "page");
            }

            const carrito = document.createElement("a");
            carrito.href = "carrito.html";
            carrito.className = "btn-app btn-yellow";
            carrito.textContent = "Ver carrito";

            if (paginaActual === "carrito.html" ||
                paginaActual === "confirmar-pedido.html") {
                carrito.classList.add("nav-item-activo");
                carrito.setAttribute("aria-current", "page");
            }

            menu.appendChild(perfil);
            menu.appendChild(carrito);
        }

        // Cerrar sesión.
        const cerrar = document.createElement("button");
        cerrar.type = "button";
        cerrar.className = "btn-app btn-red nav-cerrar";
        cerrar.textContent = "Cerrar sesión";

        cerrar.addEventListener("click", async function () {

            cerrar.disabled = true;
            cerrar.textContent = "Cerrando...";

            try {

                const respuesta = await fetch("../php/cerrar_sesion.php", {
                    method: "POST",
                    credentials: "same-origin"
                });

                const datos = await respuesta.json();

                if (!respuesta.ok || !datos.exito) {
                    throw new Error("No se pudo cerrar la sesión.");
                }

                window.location.href = "index.html";

            } catch (error) {

                alert("No se pudo cerrar la sesión.");
                cerrar.disabled = false;
                cerrar.textContent = "Cerrar sesión";
            }
        });

        menu.appendChild(cerrar);

    } catch (error) {
        console.error("Error al consultar la sesión:", error);
    }
}

// Ejecutar al abrir la página.
iniciarNavegacion();
