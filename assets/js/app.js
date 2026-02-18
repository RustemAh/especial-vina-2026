const $ = (sel) => document.querySelector(sel);
const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv';

async function init() {
    // 1. CARGAR PARRILLA DESDE GOOGLE SHEETS (Carrusel Horizontal)
    try {
        const r = await fetch(`${SHEET_CSV}&t=${new Date().getTime()}`);
        const text = await r.text();
        const filas = text.split(/\r?\n/).slice(1);
        const cont = $("#parrillaContainer");
        cont.innerHTML = '';

        filas.forEach(f => {
            const cols = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 2) {
                const artista = cols[1].replace(/"/g, "").trim();
                const img = cols[2] ? cols[2].replace(/"/g, "").trim() : "";
                cont.innerHTML += `
                    <div class="artist-card">
                        <img src="${img || 'https://via.placeholder.com/70'}" alt="${artista}">
                        <span>${artista}</span>
                    </div>`;
            }
        });
    } catch (e) { console.error("Error Sheets:", e); }

    // 2. CARGAR NOTICIAS
    try {
        const r = await fetch('assets/data/noticias.json?t=' + Date.now());
        const data = await r.json();
        $("#newsList").innerHTML = data.items.map(n => `
            <li class="newsitem"><a href="${n.url}" target="_blank">${n.title}</a></li>
        `).join('');
    } catch (e) { console.error("Error Noticias:", e); }

    // 3. CARGAR JURADO
    try {
        const r = await fetch('assets/data/jurado.json');
        const data = await r.json();
        window.juradoData = data;
        $("#grid").innerHTML = data.map((p, i) => `
            <div class="card" onclick="showJurado(${i})">
                <img src="${p.photo}">
                <div class="card__body"><strong>${p.name}</strong><br><small>${p.role}</small></div>
            </div>
        `).join('');
    } catch (e) { console.error("Error Jurado:", e); }
}

window.showJurado = (i) => {
    const p = window.juradoData[i];
    $("#modalImg").src = p.photo;
    $("#modalTitle").textContent = p.name;
    $("#modalBio").textContent = p.bio;
    $("#modal").classList.add('is-active');
}

$("#closeModal").onclick = $("#btnCerrar").onclick = () => $("#modal").classList.remove('is-active');

document.addEventListener("DOMContentLoaded", init);
