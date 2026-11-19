(function () {

    const formulario = document.getElementById("formPerfil");

    if (!formulario) {
        return;
    }

    const campos = {
        nombre: document.getElementById("perfilNombre"),
        apellidos: document.getElementById("perfilApellidos"),
        correo: document.getElementById("perfilCorreo"),
        telefono: document.getElementById("perfilTelefono"),
        codigo_postal: document.getElementById("perfilCodigoPostal"),
        direccion: document.getElementById("perfilDireccion"),
        referencias: document.getElementById("perfilReferencias")
    };

    const nombreCompletoTexto = document.getElementById("perfilNombreCompleto");
    const identificadorTexto = document.getElementById("perfilIdentificador");
    const avatar = document.getElementById("perfilAvatar");
    const mensaje = document.getElementById("perfilMensaje");
    const botonGuardar = document.getElementById("btnGuardarPerfil");
    let idUsuarioActual = null;

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = "perfil-mensaje " + tipo;
    }

    function actualizarIdentidad(nombreCompleto, idUsuario) {

        const nombreLimpio = String(nombreCompleto || "Cliente").trim();
        const partes = nombreLimpio.split(/\s+/).filter(Boolean);

        nombreCompletoTexto.textContent = nombreLimpio;
        identificadorTexto.textContent =
            "ID de cliente: GM-" + String(idUsuario).padStart(5, "0");

        const iniciales = (
            (partes[0] || "G").charAt(0) +
            (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "M")
        ).toUpperCase();

        avatar.textContent = iniciales;

        // Mantener actualizado el saludo superior.
        const saludo = document.querySelector(".nav-saludo");
        if (saludo) {
            saludo.textContent = "Hola, " + (partes[0] || "Usuario");
        }
    }

    function cargarDatos(perfil) {

        const partes = String(perfil.nombre_completo || "").trim()
            .split(/\s+/).filter(Boolean);

        campos.nombre.value = partes.shift() || "";
        campos.apellidos.value = partes.join(" ");
        campos.correo.value = perfil.correo || "";
        campos.telefono.value = perfil.telefono || "";
        campos.codigo_postal.value = perfil.codigo_postal || "";
        campos.direccion.value = perfil.direccion || "";
        campos.referencias.value =
            perfil.referencias === "Sin referencias"
                ? ""
                : (perfil.referencias || "");

        idUsuarioActual = Number(perfil.id_usuario);
        actualizarIdentidad(perfil.nombre_completo, idUsuarioActual);
    }

    async function consultarPerfil() {

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Cargando...";

        try {

            const respuesta = await fetch("../php/perfil_cliente.php", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito || !resultado.perfil) {
                throw new Error(resultado.mensaje || "No se pudo cargar tu perfil.");
            }

            cargarDatos(resultado.perfil);

        } catch (error) {

            console.error("Error al consultar perfil:", error);
            mostrarMensaje(error.message, "error");

        } finally {

            botonGuardar.disabled = false;
            botonGuardar.textContent = "Guardar cambios";
        }
    }

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const datos = {
            nombre: campos.nombre.value.trim(),
            apellidos: campos.apellidos.value.trim(),
            telefono: campos.telefono.value.trim(),
            codigo_postal: campos.codigo_postal.value.trim(),
            direccion: campos.direccion.value.trim(),
            referencias: campos.referencias.value.trim()
        };

        if (!datos.nombre || !datos.apellidos || !datos.telefono ||
            !datos.codigo_postal || !datos.direccion) {
            mostrarMensaje("Completa todos los campos obligatorios.", "error");
            return;
        }

        if (!/^[0-9]{10}$/.test(datos.telefono)) {
            mostrarMensaje("El teléfono debe contener exactamente 10 dígitos.", "error");
            campos.telefono.focus();
            return;
        }

        if (!/^[0-9]{5}$/.test(datos.codigo_postal)) {
            mostrarMensaje("El código postal debe contener exactamente 5 dígitos.", "error");
            campos.codigo_postal.focus();
            return;
        }

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Guardando...";
        mostrarMensaje("", "");

        try {

            const respuesta = await fetch("../php/perfil_cliente.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito) {
                throw new Error(resultado.mensaje || "No se pudieron guardar los cambios.");
            }

            const nombreCompleto = datos.nombre + " " + datos.apellidos;
            actualizarIdentidad(nombreCompleto, idUsuarioActual);

            mostrarMensaje("Tus datos se guardaron correctamente.", "exito");

        } catch (error) {

            console.error("Error al guardar perfil:", error);
            mostrarMensaje(error.message, "error");

        } finally {

            botonGuardar.disabled = false;
            botonGuardar.textContent = "Guardar cambios";
        }
    });

    consultarPerfil();

})();
