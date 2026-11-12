// Navegación compartida: catálogo público, registro e inicio de sesión.
(async function iniciarNavegacion() {
    const menu = document.getElementById("navSesion");
    if (!menu) return;
    try {
        const respuesta = await fetch("../php/sesion.php", { credentials: "same-origin", cache: "no-store" });
        if (!respuesta.ok) throw new Error("Sin respuesta de sesión");
        const sesion = await respuesta.json();
        if (sesion.autenticado && sesion.usuario) {
            const nombre = document.createElement("span");
            nombre.className = "nav-item";
            nombre.textContent = "Hola, " + sesion.usuario.nombre;
            const salir = document.createElement("button");
            salir.type = "button";
            salir.className = "btn-app btn-red nav-cerrar";
            salir.textContent = "Cerrar sesión";
            salir.addEventListener("click", async () => {
                salir.disabled = true;
                try {
                    const r = await fetch("../php/cerrar_sesion.php", { method:"POST", credentials:"same-origin" });
                    const dato = await r.json();
                    if (!r.ok || !dato.exito) throw new Error("Error de cierre");
                    location.href = "index.html";
                } catch(e) {
                    alert("No se pudo cerrar sesión."); salir.disabled = false;
                }
            });
            menu.replaceChildren(nombre, salir);
        } else {
            const link = document.createElement("a");
            link.href = "login.html";
            link.className = "btn-app btn-yellow";
            link.textContent = "Iniciar sesión";
            menu.replaceChildren(link);
        }
    } catch(e) {
        // Mostrar el enlace de acceso aunque falle la conexión.
        menu.innerHTML = '<a class="btn-app btn-yellow" href="login.html">Iniciar sesión</a>';
    }
})();
