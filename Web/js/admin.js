// Mostrar resumen administrativo y proteger la vista
async function cargarResumen() {
    try {
        const respuesta = await fetch("../php/admin_resumen.php", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.exito) {
            window.location.replace("login.html");
            return;
        }

        document.getElementById("totalPendientes").textContent = datos.pendientes;
        document.getElementById("totalProductos").textContent = datos.productos;
        document.getElementById("totalMensajes").textContent = datos.mensajes;
        document.getElementById("totalVentas").textContent =
            Number(datos.ventas).toLocaleString("es-MX", {
                style: "currency", currency: "MXN"
            });

        document.body.classList.remove("admin-oculto");
    } catch (error) {
        console.error("No se pudo cargar el panel:", error);
        window.location.replace("login.html");
    }
}

const botonCerrar = document.getElementById("adminCerrarSesion");
botonCerrar.addEventListener("click", async function () {
    botonCerrar.disabled = true;
    try {
        const respuesta = await fetch("../php/cerrar_sesion.php", {
            method: "POST", credentials: "same-origin"
        });
        const datos = await respuesta.json();
        if (!respuesta.ok || !datos.exito) throw new Error("No se pudo cerrar sesión.");
        window.location.replace("login.html");
    } catch (error) {
        alert("No se pudo cerrar sesión. Intenta nuevamente.");
        botonCerrar.disabled = false;
    }
});

cargarResumen();
