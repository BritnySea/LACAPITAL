/* =========  panel.js  ––  solo en panel.html  ========= */
const API  = "https://lacapital-production.up.railway.app/api/hamburguesas/";
const LSID = "isLogged";

/* ---------- utilidades ---------- */
const corto = url => {
  const n = url.split("/").pop().split("?")[0];
  return n.length > 25 ? n.slice(0, 22) + "…" : n;
};

// Función para leer cookies (útil para CSRF)
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/* Genera el HTML de cada tarjeta de hamburguesa */
const cardHTML = (h, idx) => `
  <div class="hamburguesa" data-id="${h.id}">
    <div class="numero">${idx + 1}</div>
    <div class="info">
      <h3>${h.nombre}</h3>
      <p><strong>Descripción:</strong> ${h.descripcion}</p>
      <p><strong>Alto:</strong> ${h.tamaño_alto} cm</p>
      <p><strong>Ancho:</strong> ${h.tamaño_ancho} cm</p>
      <p><strong>Precio:</strong> ${h.precio} Bs</p>
      <p><a href="${h.modelo3d}" download>Descargar 3D (.fbx)</a></p>
    </div>
    <div class="derecha">
      <div class="foto">
        <img src="${h.imagen}" alt="Foto de ${h.nombre}">
      </div>
      <div class="texto-textura">
        <p><strong>Textura:</strong> ${corto(h.textura_modelo)}</p>
      </div>
      <div class="botones">
        <button onclick="editar(${h.id})">✏️ Editar</button>
        <button onclick="eliminar(${h.id})">🗑️ Eliminar</button>
      </div>
    </div>
  </div>`;

/* --------------- init --------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById('lista-hamburguesas');
  try {
    console.log("📡 Fetching hamburguesas...");
    const response = await fetch(API + "listar/", {
      credentials: 'include'    // si usas cookies de sesión
    });
    console.log("🔄 Listar response:", response.status);
    const data = await response.json();
    lista.innerHTML = data.map(cardHTML).join("");
  } catch (err) {
    console.error("❌ Error al cargar lista:", err);
    lista.innerHTML = "<p style='color:red;text-align:center'>Error al cargar.</p>";
  }
});

/* ------ handlers globales ------ */
const editar = id => {
  location.href = `formulario.html?id=${id}`;
};

async function eliminar(id) {
  if (!confirm("¿Eliminar esta hamburguesa?")) return;

  const url = `${API}${id}/eliminar/`;
  console.log(`🗑️ Intentando DELETE → ${url}`);
  console.log("🔍 CSRF token:", getCookie("csrftoken"));

  try {
    const resp = await fetch(url, {
      method: "DELETE",
      credentials: "include",            // envía cookies de sesión
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      }
    });

    const text = await resp.text();
    console.log("🔄 DELETE response:", resp.status, text);

    if (!resp.ok) {
      throw new Error(`Status ${resp.status}`);
    }

    // Elimina la tarjeta del DOM
    const card = document.querySelector(`.hamburguesa[data-id="${id}"]`);
    if (card) card.remove();

    alert("✅ Hamburguesa eliminada correctamente.");
  } catch (e) {
    console.error("❌ Falló eliminar:", e);
    alert("No se pudo eliminar la hamburguesa. Revisa la consola para más detalles.");
  }
}
