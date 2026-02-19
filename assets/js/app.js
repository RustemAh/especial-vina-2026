const $ = (sel) => document.querySelector(sel);

// CONFIGURACIÓN DE RUTAS (Relativas puras para evitar líos de carpetas)
const CONFIG = {
  SHEET: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv',
  NEWS: 'assets/data/noticias.json',
  JURADO: 'assets/data/jurado.json',
  COMP: 'assets/data/competencia.json'
};

async function initParrilla() {
  try {
    const resp = await fetch(`${CONFIG.SHEET}&t=${Date.now()}`);
    const text = await resp.text();
    const rows = text.split(/\r?\n/).slice(1);
    const schedule = {};

    rows.forEach(row => {
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length >= 2) {
        const d = cols[0].replace(/"/g, "").trim();
        if (!schedule[d]) schedule[d] = [];
        schedule[d].push({ name: cols[1].replace(/"/g, ""), img: cols[2]?.trim() });
      }
    });

    const dias = Object.keys(schedule);
    $("#tabsNav").innerHTML = dias.map((d, i) => 
      `<button class="tab-btn ${i===0?'active':''}" onclick="renderDay('${d}')">${d}</button>`
    ).join('');

    window.fullSchedule = schedule;
    renderDay(dias[0]);
  } catch (e) { console.error("Error Parrilla:", e); }
}

window.renderDay = (dia) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText === dia));
  $("#tabContent").innerHTML = window.fullSchedule[dia].map(art => `
    <div class="card-old">
      <div class="img-square">
        <img src="${art.img || 'https://via.placeholder.com/300'}" alt="${art.name}">
      </div>
      <div class="card-body"><h3>${art.name}</h3></div>
    </div>
  `).join('');
};

async function initNews() {
  const list = $("#newsList");
  if (!list) return;
  try {
    // EL TRUCO: Forzamos la descarga del archivo fresco ignorando el caché del navegador
    const resp = await fetch(CONFIG.NEWS + '?nocache=' + new Date().getTime(), {
      cache: 'no-store'
    });
    const data = await resp.json();
    
    if (data.items && data.items.length > 0) {
      list.innerHTML = data.items.map(n => `
        <li class="news-item">
          <a href="${n.url}" target="_blank">${n.title}</a>
          <p>${n.excerpt || ''}</p>
        </li>
      `).join('');
    }
  } catch (e) { console.error("Error Noticias:", e); }
}

async function initJurado() {
  try {
    const resp = await fetch(CONFIG.JURADO + '?t=' + Date.now());
    window.juradoData = await resp.json();
    $("#grid").innerHTML = window.juradoData.map((j, i) => `
      <div class="card-old" onclick="openModal(${i})">
        <div class="img-square">
          <img src="${j.photo}" alt="${j.name}">
        </div>
        <div class="card-body">
          <h4>${j.name}</h4>
          <small>${j.role}</small>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error("Error Jurado:", e); }
}

async function initCompetencia() {
  const compGrid = $("#compGrid");
  if (!compGrid) return;
  try {
    const resp = await fetch(CONFIG.COMP + '?t=' + Date.now());
    const data = await resp.json();
    compGrid.innerHTML = data.map(c => `
      <div class="card-old">
        <div class="card-body">
          <span class="badge" style="background:${c.category === 'Folclórica' ? 'var(--naranja)' : 'var(--magenta)'}">${c.category}</span>
          <h4 style="margin:10px 0 5px;">${c.song}</h4>
          <p style="font-size:13px; margin:0;">${c.performer}</p>
          <small style="color:var(--muted); font-weight:800; text-transform:uppercase;">${c.country}</small>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error("Error Competencia:", e); }
}

window.openModal = (i) => {
  const j = window.juradoData[i];
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

document.addEventListener("DOMContentLoaded", () => {
  initParrilla();
  initNews();
  initJurado();
  initCompetencia();
});
