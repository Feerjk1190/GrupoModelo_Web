const formularioContacto = document.getElementById("formContacto");
const botonEnviarContacto = document.getElementById("btnEnviarContacto");
const avisoContacto = document.getElementById("contactoAviso");

function mostrarAvisoContacto(texto, correcto = false) {

    avisoContacto.textContent = texto;

    avisoContacto.style.color = correcto ? "#16803c" : "#c62828";
    avisoContacto.style.fontWeight = "bold";
    avisoContacto.style.fontSize = "14px";
}

formularioContacto.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    // Obtener los datos escritos por el usuario
    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        asunto: document.getElementById("asunto").value,
        mensaje: document.getElementById("mensaje").value.trim()
    };

    // Validar que los campos estén completos
    if (
        !datos.nombre ||
        !datos.correo ||
        !datos.asunto ||
        !datos.mensaje
    ) {
        mostrarAvisoContacto("Completa todos los campos.");
        return;
    }

    // Validar el correo
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(datos.correo)) {
        mostrarAvisoContacto("Ingresa un correo electrónico válido.");
        return;
    }

    // Evitar que se envíe dos veces mientras se procesa
    botonEnviarContacto.disabled = true;
    botonEnviarContacto.textContent = "Enviando...";
    mostrarAvisoContacto("");

    try {

        const respuesta = await fetch("../php/enviar_contacto.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                resultado.mensaje || "No se pudo enviar el mensaje."
            );
        }

        // Mostrar éxito y limpiar los campos
        mostrarAvisoContacto(
            "Mensaje enviado correctamente",
            true
        );

        formularioContacto.reset();

    } catch (error) {

        console.error("Error al enviar contacto:", error);

        mostrarAvisoContacto(
            error.message || "Ocurrió un error al enviar el mensaje."
        );

    } finally {

        botonEnviarContacto.disabled = false;
        botonEnviarContacto.textContent = "Enviar mensaje";

    }
});
