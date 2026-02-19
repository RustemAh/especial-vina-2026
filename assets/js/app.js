/**
 * Especial Viña 2026 - El Epicentro
 * Lógica final unificada y optimizada
 */

const $ = (s) => document.querySelector(s);

// 1. CONFIGURACIÓN DE RUTAS DINÁMICAS
// Detecta si el sitio corre en GitHub Pages o local
const isGitHub = window.location.hostname.includes('github.io');
const BASE = isGitHub ? '/especial-vina-2026/' : './';
const TIME = `?v=${new Date().getTime()}`; // Rompe el caché del navegador

const CONFIG = {
  SHEET: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv',
  NEWS: BASE + 'assets/data/noticias.json' + TIME,
  JURADO: BASE + 'assets/data/jurado.json' + TIME,
  COMP: BASE + 'assets/data/competencia.json' + TIME
};

// 2. CARGAR PARRILLA (GOOGLE SHEETS)
async function initParrilla() {
  const nav = $("#tabsNav");
  const content = $("#tabContent");
  if (!nav || !content) return;

  try {
    const resp = await fetch(`${CONFIG.SHEET}&t=${Date.now()}`);
    const text = await resp.text();
    const rows = text.split(/\r?\n/).slice(1);
    const schedule = {};

    rows.forEach(row => {
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length >= 2) {
        const dia = cols[0].replace(/"/g, "").trim();
        const artista = cols[1].replace(/"/g, "").trim();
        const img = cols[2] ? cols[2].replace(/"/g, "").trim() : "";
        if (!schedule[dia]) schedule[dia] = [];
        schedule[dia].push({ name: artista, img: img });
      }
    });

    const dias = Object.keys(schedule);
    if (dias.length === 0) return;

    nav.innerHTML = dias.map((d, i) => 
      `<button class="tab-btn ${i===0?'active':''}" onclick="renderDay('${d}')">${d}</button>`
    ).join('');

    window.fullSchedule = schedule;
    renderDay(dias[0]);
  } catch (e) {
    content.innerHTML = "<p>Actualizando la programación oficial...</p>";
  }
}

window.renderDay = (dia) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText === dia));
  $("#tabContent").innerHTML = window.fullSchedule[dia].map(art => `
    <div class="card-old">
      <div class="img-square">
        <img src="${art.img || 'https://via.placeholder.com/300'}" alt="${art.name}" loading="lazy">
      </div>
      <div class="card-body"><h3>${art.name}</h3></div>
    </div>
  `).join('');
};

// 3. CARGAR NOTICIAS (JSON WP)
async function initNews() {
  const list = $("#newsList");
  if (!list) return;

  try {
    const resp = await fetch(CONFIG.NEWS, { cache: 'no-store' });
    const data = await resp.json();
    
    if (!data.items || data.items.length === 0) {
      list.innerHTML = "<li>No hay noticias recientes con el tag #vina2026.</li>";
      return;
    }

    list.innerHTML = data.items.map(n => `
      <li class="news-item">
        <a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a>
        <p>${n.excerpt || 'Haz clic para leer la nota completa en El Epicentro.'}</p>
      </li>
    `).join('');
  } catch (e) {
    list.innerHTML = "<li>Sincronizando con la sala de prensa de El Epicentro...</li>";
  }
}

// 4. CARGAR JURADO
async function initJurado() {
  const grid = $("#grid");
  if (!grid) return;

  try {
    const resp = await fetch(CONFIG.JURADO);
    const data = await resp.json();
    window.juradoData = data;

    grid.innerHTML = data.map((j, i) => `
      <div class="card-old" onclick="openModal(${i})">
        <div class="img-square">
          <img src="${j.photo}" alt="${j.name}" loading="lazy">
        </div>
        <div class="card-body">
          <h4>${j.name}</h4>
          <small>${j.role}</small>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error("Error Jurado:", e); }
}

// 5. CARGAR COMPETENCIA
async function initCompetencia() {
  const compGrid = $("#compGrid");
  if (!compGrid) return;

  try {
    const resp = await fetch(CONFIG.COMP);
    const data = await resp.json();

    compGrid.innerHTML = data.map(c => `
      <div class="card-old">
        <div class="card-body">
          <span class="badge" style="background:${c.category === 'Folclórica' ? 'var(--naranja)' : 'var(--magenta)'}">
            ${c.category}
          </span>
          <h4>${c.song}</h4>
          <p style="font-size:13px; margin:5px 0;">${c.performer}</p>
          <small style="font-weight:800; color:var(--muted); text-transform:uppercase;">${c.country}</small>
        </div>
      </div>
    `).join('');
  } catch (e) {
    compGrid.innerHTML = "<p>Competencia en actualización.</p>";
  }
}

// 6. LÓGICA DE MODALES
window.openModal = (i) => {
  const j = window.juradoData[i];
  if(!j) return;
  $("#modalImg").src = j.photo;
  $("#modalTitle").innerText = j.name;
  $("#modalBio").innerText = j.bio;
  $("#modal").classList.add('active');
  document.body.style.overflow = "hidden";
};

window.closeModal = () => {
  $("#modal").classList.remove('active');
  document.body.style.overflow = "auto";
};

// 7. INICIALIZACIÓN TOTAL
document.addEventListener("DOMContentLoaded", () => {
  initParrilla();
  initNews();
  initJurado();
  initCompetencia();
});
