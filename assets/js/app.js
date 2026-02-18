const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv';

async function init() {
    // 1. Cargar Noticias (JSON generado por Python)
    try {
        const res = await fetch('assets/data/noticias.json');
        const data = await res.json();
        document.getElementById('newsList').innerHTML = data.items.map(n => 
            `<li class="newsitem"><a href="${n.url}" target="_blank">${n.title}</a></li>`
        ).join('');
    } catch (e) { console.error("Error noticias"); }

    // 2. Cargar Parrilla (Google Sheets Directo)
    try {
        const res = await fetch(`${SHEET_CSV}&t=${new Date().getTime()}`);
        const csv = await res.text();
        const filas = csv.split('\n').slice(1);
        let html = ''; let diaActual = '';
        filas.forEach(f => {
            const [dia, artista, img] = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (artista) {
                const cleanDia = dia.replace(/"/g, "");
                if (cleanDia !== diaActual) {
                    diaActual = cleanDia;
                    html += `<div class="sidebar-day">${diaActual}</div>`;
                }
                html += `<div class="sidebar-artist"><img src="${img.replace(/"/g, "")}"><span>${artista.replace(/"/g, "")}</span></div>`;
            }
        });
        document.getElementById('parrillaContainer').innerHTML = html;
    } catch (e) { console.error("Error Sheets"); }

    // 3. Cargar Jurado
    try {
        const res = await fetch('assets/data/jurado.json');
        const jurado = await res.json();
        document.getElementById('grid').innerHTML = jurado.map((p, i) => `
            <div class="card" onclick="showJurado(${i})" style="cursor:pointer; background:white; padding:10px; border-radius:10px;">
                <img src="${p.photo}" style="width:100%; border-radius:8px;">
                <h4 style="margin:10px 0 5px;">${p.name}</h4>
                <small>${p.role}</small>
            </div>
        `).join('');
        window.jurado = jurado;
    } catch (e) { console.error("Error jurado"); }
}

window.showJurado = (i) => {
    const p = window.jurado[i];
    document.getElementById('modalImg').src = p.photo;
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalBio').textContent = p.bio;
    document.getElementById('modal').hidden = false;
}

document.getElementById('closeModal').onclick = () => document.getElementById('modal').hidden = true;

init();
