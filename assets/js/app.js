const $ = (sel) => document.querySelector(sel);

// CONFIGURACIÓN DE RUTAS
const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv';
const NEWS_DATA = 'assets/data/noticias.json';
const JURADO_DATA = 'assets/data/jurado.json';

/* --- MOTOR DEL CALENDARIO (GOOGLE SHEETS) --- */
async function loadParrilla() {
    const cont = $("#parrillaContainer");
    try {
        const r = await fetch(`${SHEET_CSV}&t=${new Date().getTime()}`);
        const text = await r.text();
        const filas = text.split(/\r?\n/).slice(1);
        
        // Objeto para agrupar artistas por día
        const programacion = {};

        filas.forEach(f => {
            const cols = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                const dia = cols[0].replace(/"/g, "").trim();
                const artista = cols[1].replace(/"/g, "").trim();
                const img = cols[2] ? cols[2].replace(/"/g, "").trim() : "";

                if (!programacion[dia]) programacion[dia] = [];
                programacion[dia].push({ nombre: artista, foto: img });
            }
        });

        cont.innerHTML = '';

        // Generar las columnas por cada día detectado
        for (const dia in programacion) {
            const artistasHTML = programacion[dia].map(art => `
                <div class="artista-mini">
                    <img src="${art.foto || 'https://via.placeholder.com/50'}" alt="${art.nombre}" loading="lazy">
                    <span>${art.nombre}</span>
                </div>
            `).join('');

            cont.innerHTML += `
                <article class="dia-columna">
                    <div class="dia-header">${dia}</div>
                    <div class="dia-artistas">
                        ${artistasHTML}
                    </div>
                </article>
            `;
        }
    } catch (e) {
        console.error("Error cargando Sheets:", e);
        cont.innerHTML = "<p class='note'>No se pudo cargar la programación diaria.</p>";
    }
}

/* --- CARGAR NOTICIAS --- */
async function loadNews() {
    try {
        const r = await fetch(`${NEWS_DATA}?t=${Date.now()}`);
        const data = await r.json();
        const list = $("#newsList");
        
        if (data.items && data.items.length > 0) {
            list.innerHTML = data.items.map(n => `
                <li class="newsitem">
                    <a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a>
                </li>
            `).join('');
        } else {
            list.innerHTML = "<li class='newsitem'>No hay noticias recientes disponibles.</li>";
        }
    } catch (e) {
        $("#newsList").innerHTML = "<li class='newsitem'>Sincronizando con la sala de prensa...</li>";
    }
}

/* --- CARGAR JURADO --- */
async function loadJurado() {
    try {
        const r = await fetch(JURADO_DATA);
        const data = await r.json();
        window.juradoData = data;
        
        $("#grid").innerHTML = data.map((p, i) => `
            <div class="card" onclick="showJurado(${i})">
                <img src="${p.photo}" alt="${p.name}" loading="lazy">
                <div class="card__body">
                    <h4 style="margin:0; font-size:15px;">${p.name}</h4>
                    <small style="color:var(--muted)">${p.role}</small>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error("Error Jurado:", e); }
}

/* --- CONTROL DEL MODAL --- */
window.showJurado = (i) => {
    const p = window.juradoData[i];
    $("#modalImg").src = p.photo;
    $("#modalTitle").textContent = p.name;
    $("#modalBio").textContent = p.bio;
    
    const modal = $("#modal");
    modal.classList.add('is-active');
    document.body.style.overflow = "hidden";
}

const closeModal = () => {
    $("#modal").classList.remove('is-active');
    document.body.style.overflow = "auto";
};

$("#closeModal").onclick = closeModal;
$("#btnCerrarModal").onclick = closeModal;

// INICIO
document.addEventListener("DOMContentLoaded", () => {
    const yearSpan = $("#year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    loadParrilla();
    loadNews();
    loadJurado();
});
