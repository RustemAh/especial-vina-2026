const $ = (sel) => document.querySelector(sel);

const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv';

/* --- CARGAR PARRILLA (GOOGLE SHEETS) --- */
async function loadParrilla() {
    const cont = $("#parrillaContainer");
    try {
        const r = await fetch(`${SHEET_CSV}&t=${new Date().getTime()}`);
        const text = await r.text();
        const filas = text.split(/\r?\n/).slice(1);
        let html = ''; let diaActual = '';

        filas.forEach(f => {
            const cols = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                const dia = cols[0].replace(/"/g, "").trim();
                const artista = cols[1].replace(/"/g, "").trim();
                const img = cols[2] ? cols[2].replace(/"/g, "").trim() : "";
                if (dia !== diaActual) {
                    diaActual = dia;
                    html += `<div class="sidebar-day">${dia}</div>`;
                }
                html += `<div class="sidebar-artist"><img src="${img}"><span>${artista}</span></div>`;
            }
        });
        cont.innerHTML = html;
    } catch (e) { console.error("Error Sheets:", e); }
}

/* --- CARGAR NOTICIAS --- */
async function loadNews() {
    try {
        const r = await fetch('assets/data/noticias.json?t=' + Date.now());
        const data = await r.json();
        $("#newsList").innerHTML = data.items.map(n => 
            `<li class="newsitem"><a href="${n.url}" target="_blank">${n.title}</a></li>`
        ).join('');
    } catch (e) { $("#newsList").innerHTML = '<li class="newsitem">Cargando noticias de prensa...</li>'; }
}

/* --- CARGAR JURADO --- */
async function loadJurado() {
    try {
        const r = await fetch('assets/data/jurado.json');
        const data = await r.json();
        window.juradoData = data;
        $("#grid").innerHTML = data.map((p, i) => `
            <div class="card" onclick="showJurado(${i})">
                <img src="${p.photo}">
                <div class="card__body">
                    <h4 style="margin:0">${p.name}</h4>
                    <small>${p.role}</small>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

/* --- MODAL CONTROL --- */
window.showJurado = (i) => {
    const p = window.juradoData[i];
    $("#modalImg").src = p.photo;
    $("#modalTitle").textContent = p.name;
    $("#modalBio").textContent = p.bio;
    $("#modal").classList.add('is-active'); // CORRECCIÓN AQUÍ
    document.body.style.overflow = "hidden";
}

$("#closeModal").onclick = () => {
    $("#modal").classList.remove('is-active'); // CORRECCIÓN AQUÍ
    document.body.style.overflow = "auto";
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    loadParrilla();
    loadNews();
    loadJurado();
});
