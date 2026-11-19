const formularioLogin = document.getElementById("formLogin");
const correoLogin = document.getElementById("loginCorreo");
const contrasenaLogin = document.getElementById("loginContrasena");
const mensajeLogin = document.getElementById("loginMensaje");
const botonMostrar = document.getElementById("mostrarContrasena");

// Mostrar mensajes
function mostrarMensajeLogin(texto, tipo) {
    mensajeLogin.textContent = texto;
    mensajeLogin.className = "login-mensaje " + tipo;
}

// Mostrar u ocultar contraseña
botonMostrar.addEventListener("click", function () {

    if (contrasenaLogin.type === "password") {

        contrasenaLogin.type = "text";
        botonMostrar.textContent = "Ocultar";
        botonMostrar.setAttribute("aria-pressed", "true");

    } else {

        contrasenaLogin.type = "password";
        botonMostrar.textContent = "Mostrar";
        botonMostrar.setAttribute("aria-pressed", "false");

    }

});

// Procesar formulario
formularioLogin.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    const correo = correoLogin.value.trim();
    const contrasena = contrasenaLogin.value;

    if (correo === "" || contrasena === "") {
        mostrarMensajeLogin(
            "Ingresa tu correo y contraseña.",
            "error"
        );
        return;
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
        mostrarMensajeLogin(
            "Ingresa un correo electrónico válido.",
            "error"
        );
        return;
    }

    const datos = new FormData();

    datos.append("correo", correo);
    datos.append("contrasena", contrasena);

    const boton = formularioLogin.querySelector(".login-boton");

    boton.disabled = true;
    boton.textContent = "INICIANDO SESIÓN...";

    try {

        const respuesta = await fetch("../php/login.php", {
            method: "POST",
            body: datos,
            credentials: "same-origin"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            mostrarMensajeLogin(resultado.mensaje || "No se pudo iniciar sesión.", "error");
            return;
        }

        mostrarMensajeLogin(resultado.mensaje, "info");

        if (resultado.rol === "Administrador") {
            window.location.replace("admin.html");
        } else {
            window.location.replace("catalogo.html");
        }

    } catch (error) {

        console.error("Error de login:", error);

        mostrarMensajeLogin(
            "No se pudo comunicar con el servidor.",
            "error"
        );

    } finally {

        boton.disabled = false;
        boton.textContent = "INICIAR SESIÓN";

    }

});
