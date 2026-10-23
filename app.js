const API = 'https://jsonplaceholder.typicode.com';
const formBuscar     = document.querySelector('#form-buscar');
const formCrear      = document.querySelector('#form-crear');
const formComentar   = document.querySelector('#form-comentar'); // actividad 4
const inputUsuario   = document.querySelector('#input-usuario');
const inputBuscar    = document.querySelector('#input-buscar');
const selectLimit    = document.querySelector('#select-limit');
const inputTitulo    = document.querySelector('#input-titulo');
const inputCuerpo    = document.querySelector('#input-cuerpo');
const btnCrear       = document.querySelector('#btn-crear');
const btnComentar    = document.querySelector('#btn-comentar'); // actividad 4
const errorCrear     = document.querySelector('#error-crear'); // actividad 4
const estadoComentar = document.querySelector('#estado-comentar'); // actividad 4
const estado         = document.querySelector('#estado');
const lista          = document.querySelector('#lista');

// 1. Petición genérica
async function peticion(url, opciones = {}) {
    const res = await fetch(url, opciones);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return { status: res.status, datos: await res.json() };
}

// 2. Funciones de interfaz
function crearTarjeta(post, esNuevo = false) {
    const art = document.createElement('article');
    art.className = esNuevo ? 'post nuevo' : 'post';
    art.dataset.id = post.id;
    const h3 = document.createElement('h3');
    h3.textContent = `#${post.id} ${post.title}`;
    const p = document.createElement('p');
    p.textContent = post.body;
    art.append(h3, p);
    return art;
}

function mostrarEstado(texto, esError = false) {
    estado.textContent = texto;
    estado.className = esError ? 'error' : '';
}

// 3. GET: listar publicaciones
formBuscar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ userId: inputUsuario.value, _limit: selectLimit.value });
    mostrarEstado('Cargando...');
    try {
        const { status, datos } = await peticion(`${API}/posts?${params}`);
        const textoFiltro = inputBuscar.value.trim().toLowerCase();
        let datosFiltrados = datos;
        if (textoFiltro) {
            datosFiltrados = datos.filter(post => post.title.toLowerCase().includes(textoFiltro));
        }
        lista.replaceChildren(...datosFiltrados.map(p => crearTarjeta(p)));
        mostrarEstado(`GET ${status}: Mostrando ${datosFiltrados.length} publicaciones.`);
    } catch (error) {
        mostrarEstado(error.message, true);
    }
});

// 4. POST: crear publicación CON VALIDACIÓN (Actividad 3)
formCrear.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorCrear.textContent = ''; // Limpiar errores previos

    const titulo = inputTitulo.value.trim();
    const cuerpo = inputCuerpo.value.trim();

    // --- VALIDACIONES ---
    if (titulo.length < 5) {
        errorCrear.textContent = 'El título debe tener al menos 5 caracteres.';
        inputTitulo.focus();
        return; // Detiene la ejecución y no envía el POST
    }
    if (cuerpo === '') {
        errorCrear.textContent = 'El contenido no puede estar vacío.';
        inputCuerpo.focus();
        return;
    }

    const nuevo = {
        title: titulo,
        body: cuerpo,
        userId: Number(inputUsuario.value)
    };
    
    btnCrear.disabled = true;
    mostrarEstado('Enviando...');
    try {
        const { status, datos } = await peticion(`${API}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevo)
        });
        lista.prepend(crearTarjeta(datos, true));
        mostrarEstado(`POST ${status}: creada con id ${datos.id}`);
        formCrear.reset();
    } catch (error) {
        mostrarEstado(error.message, true);
    } finally {
        btnCrear.disabled = false;
    }
});

// 5. POST: Crear comentario usando FormData + Object.fromEntries (Actividad 3)
formComentar.addEventListener('submit', async (e) => {
    e.preventDefault();
    estadoComentar.textContent = '';
    estadoComentar.className = '';

    // Capturamos los datos del formulario de golpe usando FormData
    const datosForm = new FormData(formComentar);

    // Convertimos el FormData a un objeto normal de JavaScript
    const comentario = Object.fromEntries(datosForm);
    
    // FormData convierte todo a texto, así que aseguramos que postId sea número
    comentario.postId = Number(comentario.postId);

    btnComentar.disabled = true;
    estadoComentar.textContent = 'Enviando comentario...';

    try {
        // Enviamos el POST como JSON (porque convertimos el objeto a string)
        const { status, datos: creado } = await peticion(`${API}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comentario)
        });
        
        estadoComentar.className = 'ok';
        estadoComentar.textContent = `POST ${status} → Comentario creado con ID: ${creado.id} (para el post ${creado.postId})`;
        formComentar.reset();
    } catch (error) {
        estadoComentar.className = 'error';
        estadoComentar.textContent = error.message;
    } finally {
        btnComentar.disabled = false;
    }
});

// 6. Clic para ver comentarios (Actividad 2)
lista.addEventListener('click', async (e) => {
    const tarjeta = e.target.closest('.post');
    if (!tarjeta) return;
    const idPost = tarjeta.dataset.id;
    const comentariosExistentes = tarjeta.nextElementSibling;
    if (comentariosExistentes && comentariosExistentes.classList.contains('comentarios')) {
        comentariosExistentes.remove();
        return;
    }
    const contenedorComentarios = document.createElement('div');
    contenedorComentarios.className = 'comentarios';
    contenedorComentarios.textContent = 'Cargando comentarios...';
    tarjeta.after(contenedorComentarios);

    try {
        const { status, datos } = await peticion(`${API}/posts/${idPost}/comments`);
        contenedorComentarios.innerHTML = `<strong>Comentarios (GET ${status}):</strong>`;
        datos.forEach(comentario => {
            const div = document.createElement('div');
            const h4 = document.createElement('h4');
            h4.textContent = comentario.name;
            const p = document.createElement('p');
            p.textContent = comentario.body;
            div.append(h4, p);
            contenedorComentarios.append(div);
        });
    } catch (error) {
        contenedorComentarios.textContent = error.message;
    }
});

// 7. Carga inicial (Formulario GET Actividad 1 y listar Actividad 2)
const contenedorResultado = document.querySelector('#resultado-get');
const query = new URLSearchParams(location.search);
if (query.get('nombre') || query.get('ciudad')) {
    contenedorResultado.textContent = `Datos recibidos -> Nombre: "${query.get('nombre')}", Ciudad: "${query.get('ciudad')}"`;
    contenedorResultado.style.background = '#d4edda';
}
formBuscar.requestSubmit();