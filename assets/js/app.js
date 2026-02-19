const $ = (s) => document.querySelector(s);

const CONFIG = {
  SHEET: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv',
  NEWS: 'assets/data/noticias.json',
  JURADO: 'assets/data/jurado.json',
  COMP: 'assets/data/competencia.json' // Añadida ruta de competencia
};

// 1. Parrilla con fotos cuadradas (Object-fit corregido)
async function initParrilla() {
  try {
    const resp = await fetch(`${CONFIG.SHEET}&v=${Date.now()}`);
    const data = await resp.text();
    const rows = data.split('\n').slice(1);
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

// 2. Noticias (Con cache-busting para forzar actualización)
async function initNews() {
  try {
    const resp = await fetch(`${CONFIG.NEWS}?t=${Date.now()}`);
    const data = await resp.json();
    $("#newsList").innerHTML = data.items.map(n => `
      <li class="news-item">
        <a href="${n.url}" target="_blank">${n.title}</a>
        <p>${n.excerpt || ''}</p>
      </li>
    `).join('');
  } catch (e) { console.error("Error Noticias:", e); }
}

// 3. Jurado (Formato Cuadrado)
async function initJurado() {
  try {
    const resp = await fetch(CONFIG.JURADO);
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

// 4. Competencia (RESTAURADA)
async function initCompetencia() {
  const compGrid = $("#compGrid"); // Asegúrate de tener este ID en el HTML
  if (!compGrid) return;
  try {
    const resp = await fetch(CONFIG.COMP);
    const data = await resp.json();
    compGrid.innerHTML = data.map(c => `
      <div class="card-old competencia-item">
        <div class="card-body">
          <span class="badge">${c.category}</span>
          <h4 style="margin:10px 0 5px;">${c.song}</h4>
          <p style="font-size:13px;">${c.performer} (<strong>${c.country}</strong>)</p>
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
};

window.closeModal = () => $("#modal").classList.remove('active');

document.addEventListener("DOMContentLoaded", () => {
  initParrilla();
  initNews();
  initJurado();
  initCompetencia(); // Lanzar carga de competencia
});
