const $ = (s) => document.querySelector(s);

const CONFIG = {
  SHEET: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQK-V9ZNN6S14OYLQGFQJ_si0sR7r1kSFmJCgrBC1k6MtCoJuk8ObmJTwiCAeBTbUirne-R-G8d9mqx/pub?gid=0&single=true&output=csv',
  NEWS: 'assets/data/noticias.json',
  JURADO: 'assets/data/jurado.json'
};

// 1. Cargar Parrilla desde Sheets con Tabs
async function initParrilla() {
  const resp = await fetch(`${CONFIG.SHEET}&v=${Date.now()}`);
  const data = await resp.text();
  const rows = data.split('\n').slice(1);
  const schedule = {};

  rows.forEach(row => {
    const [dia, artista, img] = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const d = dia.replace(/"/g, "").trim();
    if (!schedule[d]) schedule[d] = [];
    schedule[d].push({ name: artista.replace(/"/g, ""), img: img?.trim() });
  });

  const dias = Object.keys(schedule);
  $("#tabsNav").innerHTML = dias.map((d, i) => 
    `<button class="tab-btn ${i===0?'active':''}" onclick="renderDay('${d}')">${d}</button>`
  ).join('');

  window.fullSchedule = schedule;
  renderDay(dias[0]);
}

window.renderDay = (dia) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.innerText === dia));
  $("#tabContent").innerHTML = window.fullSchedule[dia].map(art => `
    <div class="card-premium">
      <img src="${art.img || 'https://via.placeholder.com/400x250'}" alt="${art.name}">
      <div class="card-body"><h3>${art.name}</h3></div>
    </div>
  `).join('');
};

// 2. Cargar Noticias (Magazine Style)
async function initNews() {
  const resp = await fetch(CONFIG.NEWS);
  const data = await resp.json();
  $("#newsList").innerHTML = data.items.map(n => `
    <li class="news-item">
      <a href="${n.url}" target="_blank">${n.title}</a>
      <p>${n.excerpt || ''}</p>
    </li>
  `).join('');
}

// 3. Cargar Jurado con Modal
async function initJurado() {
  const resp = await fetch(CONFIG.JURADO);
  window.juradoData = await resp.json();
  $("#grid").innerHTML = window.juradoData.map((j, i) => `
    <div class="card-premium" onclick="openModal(${i})">
      <img src="${j.photo}" alt="${j.name}">
      <div class="card-body">
        <h4>${j.name}</h4>
        <small>${j.role}</small>
      </div>
    </div>
  `).join('');
}

window.openModal = (i) => {
  const j = window.juradoData[i];
  $("#modalImg").src = j.photo;
  $("#modalTitle").innerText = j.name;
  $("#modalBio").innerText = j.bio;
  $("#modal").classList.add('active');
};

window.closeModal = () => $("#modal").classList.remove('active');

// Inicializar Todo
document.addEventListener("DOMContentLoaded", () => {
  initParrilla();
  initNews();
  initJurado();
});
