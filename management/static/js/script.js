// static/js/script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBblob3BpMOfvTIVN7roF7uIreDjXMvzao",
  authDomain: "la-capital-73e6f.firebaseapp.com",
  projectId: "la-capital-73e6f",
  storageBucket: "la-capital-73e6f.firebasestorage.app",
  messagingSenderId: "96162435417",
  appId: "1:96162435417:web:3bde74753c24a89fd6fc48",
  measurementId: "G-9PN7EBW2H0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Referencias DOM
const form = document.getElementById('formHamburguesa');
const anuncio = document.getElementById('anuncioCreacion');
const textoAnuncio = document.getElementById('textoAnuncio');
const guardarBtn = document.getElementById('guardarBtn');

let submitIntentado = false;   // ¿ya se intentó enviar una vez?

// Función para mostrar mensajes de estado
function mostrarEstado(mensaje, esError = false, autoOcultar = true) {
  anuncio.classList.remove('hidden');
  anuncio.style.background = esError ? '#ff4444' : '#4CAF50';
  textoAnuncio.textContent = mensaje;
  
  if (!esError && autoOcultar) {
    setTimeout(() => {
      anuncio.classList.add('hidden');
    }, 5000);
  }
}

// Validadores de campos
const campos = [
  {
    id: "nombre", isFile: false,
    validator: v => /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9 ]+$/.test(v),
    msg: "El nombre solo admite letras, números y espacios."
  },
  {
    id: "descripcion", isFile: false,
    validator: v => v.length >= 5,
    msg: "Descripción mínima 5 caracteres."
  },
  {
    id: "modelo3d", isFile: true,
    validator: f => f && f.name.toLowerCase().endsWith(".fbx"),
    msg: "Sube un .fbx válido."
  },
  {
    id: "foto", isFile: true,
    validator: f => f && ["image/png","image/jpeg","image/webp"].includes(f.type),
    msg: "Imagen PNG/JPG/WEBP."
  },
  {
    id: "textura", isFile: true,
    validator: f => f && ["image/png","image/jpeg"].includes(f.type),
    msg: "Textura PNG o JPG."
  },
  {
    id: "tamanio_alto", isFile: false,
    validator: v => { const n = +v; return n>=1&&n<=100; },
    msg: "Alto 1–100 cm."
  },
  {
    id: "tamanio_ancho", isFile: false,
    validator: v => { const n = +v; return n>=1&&n<=100; },
    msg: "Ancho 1–100 cm."
  },
  {
    id: "peso", isFile: false,
    validator: v => { const n = +v; return n>=1&&n<=500; },
    msg: "Peso 1–500 g."
  },
  {
    id: "precio", isFile: false,
    validator: v => {
      const num = parseFloat(v.replace(",", "."));
      return /^\d+([.,]\d{1,2})?$/.test(v) && num>=0.01;
    },
    msg: "Precio ≥ 0.01 Bs."
  }
];

// Validar un campo individual
// Dentro de la función validarCampo
function validarCampo(campo) {
  const elemento = document.getElementById(campo.id);
  const errorElement = document.getElementById(`error-${campo.id}`);
  let valor;
  
  if (campo.isFile) {
    valor = elemento.files[0];
  } else {
    valor = elemento.value;
  }

  if (!campo.validator(valor)) {
    errorElement.textContent = campo.msg;
    errorElement.classList.add('error-visible'); // Añade esta línea
    return false;
  } else {
    errorElement.textContent = '';
    errorElement.classList.remove('error-visible'); // Añade esta línea
    return true;
  }
}
// Validar todo el formulario
function validarFormulario() {
  let valido = true;
  campos.forEach(campo => {
    if (!validarCampo(campo)) {
      valido = false;
    }
  });
  return valido;
}

// Habilitar/deshabilitar el botón según la validez después de un intento fallido
function actualizarEstadoBoton() {
  if (!submitIntentado) return;          // si aún no se intentó enviar, no tocar el botón
  guardarBtn.disabled = !validarFormulario();
}

// Función para subir archivo a Firebase
async function subirArchivo(archivo, ruta) {
  const archivoRef = ref(storage, ruta);
  await uploadBytes(archivoRef, archivo);
  return await getDownloadURL(archivoRef);
}

// Función para obtener el token CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Evento de envío del formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitIntentado = true;

  if (!validarFormulario()) {
    mostrarEstado('Por favor, corrige los errores en el formulario.', true, false);
    guardarBtn.disabled = true;          // Bloquea el botón hasta que todo sea válido
    return;
  }

  // Mostrar estado de subida (sin auto-ocultar)
  mostrarEstado('Subiendo archivos a Firebase...', false, false);
  
  // Obtener valores del formulario
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const tamanio_alto = document.getElementById('tamanio_alto').value;
  const tamanio_ancho = document.getElementById('tamanio_ancho').value;
  const peso = document.getElementById('peso').value;
  const precio = document.getElementById('precio').value;
  
  // Obtener archivos
  const modelo3d = document.getElementById('modelo3d').files[0];
  const foto = document.getElementById('foto').files[0];
  const textura = document.getElementById('textura').files[0];

  try {
    // Subir archivos a Firebase
    const [modeloUrl, fotoUrl, texturaUrl] = await Promise.all([
      subirArchivo(modelo3d, `modelos/${Date.now()}_${modelo3d.name}`),
      subirArchivo(foto, `imagenes/${Date.now()}_${foto.name}`),
      subirArchivo(textura, `texturas/${Date.now()}_${textura.name}`)
    ]);

    // Crear objeto con los datos según tu modelo
    const hamburguesaData = {
      nombre: nombre,
      descripcion: descripcion,
      modelo3d: modeloUrl,
      imagen: fotoUrl,
      textura_modelo: texturaUrl,
      tamaño_alto: parseFloat(tamanio_alto),
      tamaño_ancho: parseFloat(tamanio_ancho),
      peso: parseFloat(peso),
      precio: parseFloat(precio.replace(",", "."))
    };

    // Mostrar estado de envío al servidor
    mostrarEstado('Enviando datos al servidor...', false, false);
    
    // Enviar datos al servidor Django
    const response = await fetch('https://lacapital-production.up.railway.app/api/hamburguesas/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(hamburguesaData)
    });

    const result = await response.json();

    if (response.ok) {
      mostrarEstado('¡Hamburguesa creada con éxito!', false, true);
      form.reset();
      submitIntentado = false;           // resetea la lógica de bloqueo tras éxito
      guardarBtn.disabled = false;

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = URL_PANEL;
      }, 2000);

    } else {
      let errorMsg = 'Error en el servidor';
      if (result.errors) {
        errorMsg = Object.values(result.errors).join(', ');
      } else if (result.error) {
        errorMsg = result.error;
      } else if (result.detail) {
        errorMsg = result.detail;
      }
      throw new Error(errorMsg);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarEstado(`Error: ${error.message}`, true, false);
  }
});

// Manejar el botón de cancelar
document.getElementById('cancelarBtn').addEventListener('click', () => {
  if (confirm('¿Seguro que deseas cancelar? Los datos no guardados se perderán.')) {
    window.location.href = "{% url 'panel' %}";
  }
});

// Validación en tiempo real
campos.forEach(campo => {
  const elemento = document.getElementById(campo.id);
  if (elemento) {
    // Validar al salir del campo
    elemento.addEventListener('blur', () => {
      validarCampo(campo);
      actualizarEstadoBoton();
    });
    // Validar mientras se escribe / cambia
    if (campo.isFile) {
      elemento.addEventListener('change', () => {
        validarCampo(campo);
        actualizarEstadoBoton();
      });
    } else {
      elemento.addEventListener('input', () => {
        validarCampo(campo);
        actualizarEstadoBoton();
      });
    }
  }
});
