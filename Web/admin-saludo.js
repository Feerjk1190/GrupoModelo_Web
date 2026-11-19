async function mostrarSaludoAdmin() {

    // Buscar el menú superior
    const menu = document.querySelector(".header-app .nav-app");

    if (!menu) {
        return;
    }

    try {

        // Consultar la sesión actual
        const respuesta = await fetch("../php/sesion.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuesta.ok) {
            return;
        }

        const sesion = await respuesta.json();

        // Mostrar el saludo solamente al administrador
        if (!sesion.autenticado || !sesion.usuario) {
            return;
        }

        if (sesion.usuario.rol !== "Administrador") {
            return;
        }

        // Obtener el nombre del administrador
        const nombreCompleto =
            sesion.usuario.nombre ||
            sesion.usuario.nombre_completo ||
            sesion.usuario.nombre_usuario ||
            "Administrador";

        const primerNombre = nombreCompleto.split(" ")[0];

        // Evitar agregar dos veces el saludo
        if (document.getElementById("adminSaludo")) {
            return;
        }

        // Crear el saludo
        const saludo = document.createElement("span");

        saludo.id = "adminSaludo";
        saludo.className = "nav-item";
        saludo.textContent = "Hola, " + primerNombre;

        // Colocarlo antes del botón Ver tienda
        const botonTienda = menu.querySelector(
            'a[href="catalogo.html"]'
        );

        if (botonTienda) {
            menu.insertBefore(saludo, botonTienda);
        } else {
            menu.appendChild(saludo);
        }

    } catch (error) {
        console.error("No se pudo mostrar el saludo:", error);
    }
}

// Ejecutar cuando se abra la página
mostrarSaludoAdmin();

// Pantallas que no tienen su propio controlador de cierre de sesión.
// Admin, Mensajes y Clientes ya usan su JavaScript y no se duplican eventos.
const paginasConCierrePropio = ["admin.html", "admin-mensajes.html", "admin-clientes.html"];
const paginaActual = window.location.pathname.split("/").pop();
if (!paginasConCierrePropio.includes(paginaActual)) {
    const cerrarAdmin = document.getElementById("adminCerrarSesion");
    if (cerrarAdmin) {
        cerrarAdmin.addEventListener("click", async function () {
            cerrarAdmin.disabled = true;
            try {
                const respuesta = await fetch("../php/cerrar_sesion.php", {
                    method: "POST", credentials: "same-origin"
                });
                if (!respuesta.ok) throw new Error("Error al cerrar sesión.");
                window.location.replace("login.html");
            } catch (error) {
                alert(error.message);
                cerrarAdmin.disabled = false;
            }
        });
    }
}
