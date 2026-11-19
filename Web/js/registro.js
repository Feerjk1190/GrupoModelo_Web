const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("registroMensaje");

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "registro-mensaje " + tipo;
}

formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmarContrasena").value;

    // Validar campos vacíos
    if (
        nombre === "" ||
        apellidos === "" ||
        correo === "" ||
        contrasena === "" ||
        confirmar === ""
    ) {
        mostrarMensaje("Completa todos los campos.", "error");
        return;
    }

    // Validar correo
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
        mostrarMensaje("Ingresa un correo válido.", "error");
        return;
    }

    // Validar contraseña
    if (contrasena.length < 8) {
        mostrarMensaje(
            "La contraseña debe tener al menos 8 caracteres.",
            "error"
        );
        return;
    }

    if (contrasena !== confirmar) {
        mostrarMensaje("Las contraseñas no coinciden.", "error");
        return;
    }

    // Preparar los datos del formulario
    const datos = new FormData();

    datos.append("nombre", nombre);
    datos.append("apellidos", apellidos);
    datos.append("correo", correo);
    datos.append("contrasena", contrasena);
    datos.append("confirmarContrasena", confirmar);

    const boton = formulario.querySelector(".registro-boton");

    boton.disabled = true;
    boton.textContent = "REGISTRANDO...";

    try {

        // Enviar los datos a PHP
        const respuesta = await fetch("../php/registro.php", {
            method: "POST",
            body: datos
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.exito) {

            mostrarMensaje(resultado.mensaje, "exito");

            // Limpiar el formulario
            formulario.reset();

        } else {

            mostrarMensaje(
                resultado.mensaje || "No se pudo crear la cuenta.",
                "error"
            );

        }

    } catch (error) {

        console.error("Error de registro:", error);

        mostrarMensaje(
            "No se pudo conectar con el servidor. " +
            "Verifica que Apache esté iniciado.",
            "error"
        );

    } finally {

        boton.disabled = false;
        boton.textContent = "CREAR CUENTA";

    }

});
