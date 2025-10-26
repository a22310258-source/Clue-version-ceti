/* CLUE: Versión CETI — Web (vanilla JS)
   - 5 historias cerradas; elige una al azar
   - Sugerencias, pistas globales, dificultad, scoring
   - Imágenes por personaje (reemplaza rutas en data.personajes[].img)
*/
const data = {
  personajes: [
    { nombre: "Dario", profesion: "Estudiante de Mecatrónica (mejor amigo)", img: "assets/personajes/dario.jpg" },
    { nombre: "Javi", profesion: "Estudiante de Electrónica (indiferente)", img: "assets/personajes/javi.jpg" },
    { nombre: "Ketzel", profesion: "Estudiante de Sistemas (amante secreto)", img: "assets/personajes/ketzel.jpg" },
    { nombre: "Profesor de Electronica", profesion: "Docente universitario", img: "assets/personajes/profesor.jpg" },
    { nombre: "Paola", profesion: "Estudiante de Diseño (novia de Ketzel)", img: "assets/personajes/paola.jpg" },
  ],
  armas: [
    "Tarea de Control 2",
    "Agua Bendita",
    "Carro de Dario",
    "Espada Medieval",
    "Solucion Quimica Venenosa"
  ],
  lugares: [
    "Laboratorio de Electronica",
    "Estacionamiento",
    "Biblioteca",
    "Laboratorio de Quimica",
    "Salon de Prototipos"
  ],
  casos: [
    ["Dario","Tarea de Control 2","Salon de Prototipos","Dario discutió con Quiyono tras descubrir que lo excluyó del trabajo final. Lleno de rabia, tomó la carpeta de la 'Tarea de Control 2' y lo golpeó hasta dejarlo inconsciente. Intentó simular un accidente académico."],
    ["Paola","Agua Bendita","Laboratorio de Electronica","Paola visitó el CETI y descubrió la relación entre Ketzel y Quiyono. En un impulso de celos, arrojó una botella con 'agua bendita' usada en broma en un experimento; el entorno eléctrico provocó el accidente fatal."],
    ["Javi","Carro de Dario","Estacionamiento","Javi, cansado de la actitud de Quiyono, lo empujó durante una discusión. Sin medir consecuencias, Quiyono cayó y el carro de Dario, en neutral, lo arrolló."],
    ["Profesor de Electronica","Solucion Quimica Venenosa","Laboratorio de Quimica","Tras múltiples advertencias por el bajo desempeño, el profesor decidió 'darle una lección'. Preparó una mezcla para una práctica; el exceso de reactivos generó un gas tóxico que Quiyono inhaló, cayendo inconsciente."],
    ["Ketzel","Espada Medieval","Biblioteca","Ketzel discutió con Quiyono para terminar la relación clandestina. En un arrebato, tomó una espada de utilería de un proyecto y lo hirió fatalmente."]
  ]
};

const DIFS = {
  FACIL:   { pistas: 3, limSugerencias: Infinity, noRefuta: "normal" },
  NORMAL:  { pistas: 2, limSugerencias: 8,        noRefuta: "normal" },
  DIFICIL: { pistas: 1, limSugerencias: 5,        noRefuta: "estricto" }
};

const el = (q)=>document.querySelector(q);
const log = (msg)=>{ const p=document.createElement('p'); p.textContent=msg; el('#log').prepend(p); };

// Render UI lists
function renderSuspects() {
  const grid = el('#suspectsGrid'); grid.innerHTML = '';
  data.personajes.forEach(p => {
    const card = document.createElement('div'); card.className='sus-card';
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.nombre;
    img.onerror = ()=>{ img.src='assets/personajes/placeholder.svg'; };
    const name = document.createElement('div'); name.className='name'; name.textContent = p.nombre;
    const role = document.createElement('div'); role.className='role'; role.textContent = p.profesion;
    card.append(img, name, role);
    grid.append(card);
  });
}
function renderChips() {
  const w = el('#weaponsList'); const p = el('#placesList');
  w.innerHTML=''; p.innerHTML='';
  data.armas.forEach(a=>{ const li=document.createElement('li'); li.textContent=a; w.append(li); });
  data.lugares.forEach(l=>{ const li=document.createElement('li'); li.textContent=l; p.append(li); });
}
function fillSelects() {
  const sels = ['#selSus','#accSus'].map(el);
  const selW = ['#selWeapon','#accWeapon'].map(el);
  const selP = ['#selPlace','#accPlace'].map(el);
  sels.forEach(s=>{ s.innerHTML=''; data.personajes.forEach(p=>{ const o=document.createElement('option'); o.value=o.textContent=p.nombre; s.append(o); }); });
  selW.forEach(s=>{ s.innerHTML=''; data.armas.forEach(a=>{ const o=document.createElement('option'); o.value=o.textContent=a; s.append(o); }); });
  selP.forEach(s=>{ s.innerHTML=''; data.lugares.forEach(l=>{ const o=document.createElement('option'); o.value=o.textContent=l; s.append(o); }); });
}

// Game state
let state = null;
function newGame() {
  const difKey = el('#difficulty').value;
  const conf = DIFS[difKey];
  const caso = data.casos[Math.floor(Math.random()*data.casos.length)];
  const solucion = { sospechoso: caso[0], arma: caso[1], lugar: caso[2], narrativa: caso[3] };
  const todas = new Set([...data.personajes.map(p=>p.nombre), ...data.armas, ...data.lugares]);
  const fuera = [...todas].filter(c=>![solucion.sospechoso, solucion.arma, solucion.lugar].includes(c));

  state = {
    solucion,
    cartasFuera: fuera,
    descartes: [],
    turnos: 0,
    pistasRestantes: conf.pistas,
    pistasUsadas: 0,
    revSug: 0,
    limSug: conf.limSugerencias,
    sugUsadas: 0,
    modoNoRefuta: conf.noRefuta,
    dificultad: difKey,
    activa: true
  };
  el('#narrativeCard').style.display='none';
  el('#narrativeText').textContent='';
  el('#log').innerHTML='';
  updateStats();
  renderDiscards();
  log(`🎲 Nueva partida (dificultad: ${difKey}). Investiga con sugerencias y pistas.`);
}

function updateStats() {
  const ul = el('#stats'); ul.innerHTML='';
  const score = calcScore();
  const items = [
    `Dificultad: ${state?.dificultad ?? '—'}`,
    `Turnos: ${state?.turnos ?? 0}`,
    `Pistas globales usadas: ${state?.pistasUsadas ?? 0} / restantes: ${state?.pistasRestantes ?? 0}`,
    `Sugerencias usadas: ${state?.sugUsadas ?? 0} / límite: ${state?.limSug === Infinity ? '∞' : state?.limSug}`,
    `Score (si cierras ahora): ${score}`
  ];
  items.forEach(t=>{ const li=document.createElement('li'); li.textContent=t; ul.append(li); });
}

function renderDiscards() {
  const discSus = state.descartes.filter(c=>data.personajes.some(p=>p.nombre===c));
  const discArm = state.descartes.filter(c=>data.armas.includes(c));
  const discPla = state.descartes.filter(c=>data.lugares.includes(c));
  el('#discSus').textContent = discSus.length ? discSus.join(', ') : '—';
  el('#discArm').textContent = discArm.length ? discArm.join(', ') : '—';
  el('#discPla').textContent = discPla.length ? discPla.join(', ') : '—';
}

function calcScore() {
  if(!state) return 0;
  const base=100, penT=5*state.turnos, penP=10*state.pistasUsadas, penS=2*state.revSug;
  return Math.max(0, base - penT - penP - penS);
}

// Actions
function suggest() {
  if(!state?.activa){ log("Inicia una partida."); return; }
  if(state.sugUsadas >= state.limSug){ log("⚠️ Límite de sugerencias alcanzado en este modo."); return; }
  const s = el('#selSus').value, a = el('#selWeapon').value, l = el('#selPlace').value;
  state.turnos++; state.sugUsadas++;
  const err = [];
  if(s !== state.solucion.sospechoso) err.push(s);
  if(a !== state.solucion.arma) err.push(a);
  if(l !== state.solucion.lugar) err.push(l);

  if(err.length === 0){
    if(state.modoNoRefuta === 'normal'){
      log("🤫 Nadie puede refutar tu sugerencia... (podría ser correcta).");
    }else{
      log("🤫 Nadie refuta tu sugerencia (modo difícil: es ambiguo, no confirma nada).");
    }
    updateStats(); return;
  }
  const show = err[Math.floor(Math.random()*err.length)];
  if(!state.descartes.includes(show)) { state.descartes.push(show); state.revSug++; renderDiscards(); }
  log(`🃏 Te muestran una carta que refuta tu sugerencia: «${show}» NO está en la solución.`);
  updateStats();
}

function accuse() {
  if(!state?.activa){ log("Inicia una partida."); return; }
  const s = el('#accSus').value, a = el('#accWeapon').value, l = el('#accPlace').value;
  state.turnos++;
  const ok = (s === state.solucion.sospechoso && a === state.solucion.arma && l === state.solucion.lugar);
  if(ok){
    log("✅ ¡Correcto! Descubriste toda la verdad.");
    showNarrative();
    end('resuelto');
  }else{
    let c=0; if(s===state.solucion.sospechoso) c++; if(a===state.solucion.arma) c++; if(l===state.solucion.lugar) c++;
    log(`❌ Incorrecto. Pista: tienes ${c} coincidencia(s) con la solución.`);
  }
  updateStats();
}

function globalHint() {
  if(!state?.activa){ log("Inicia una partida."); return; }
  if(state.pistasRestantes <= 0){ log("⚠️ Ya no quedan pistas globales."); return; }
  const candidatas = state.cartasFuera.filter(c=>!state.descartes.includes(c));
  if(candidatas.length===0){ log("No hay más cartas descartables por revelar."); return; }
  const c = candidatas[Math.floor(Math.random()*candidatas.length)];
  state.descartes.push(c); state.pistasRestantes--; state.pistasUsadas++; state.turnos++;
  renderDiscards();
  log(`💡 Pista global: «${c}» NO está en la solución.`);
  updateStats();
}

function reveal() {
  if(!state?.activa){ log("Inicia una partida."); return; }
  log(`🔍 SOLUCIÓN: ${state.solucion.sospechoso} con ${state.solucion.arma} en ${state.solucion.lugar}.`);
  showNarrative();
  end('spoiler');
}

function end(motivo) {
  state.activa = false;
  const score = calcScore();
  log(`📊 Fin (${motivo==='resuelto'?'✅ Resuelto':'👀 Revelado'}). Score: ${score}`);
}

function showNarrative() {
  el('#narrativeText').textContent = state.solucion.narrativa;
  el('#narrativeCard').style.display='block';
}

// Bind events
document.addEventListener('DOMContentLoaded', ()=>{
  renderSuspects(); renderChips(); fillSelects();
  el('#newGame').addEventListener('click', newGame);
  el('#btnSuggest').addEventListener('click', suggest);
  el('#btnAccuse').addEventListener('click', accuse);
  el('#btnGlobalHint').addEventListener('click', globalHint);
  el('#btnReveal').addEventListener('click', reveal);
});
