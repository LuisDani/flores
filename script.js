/* =========================================================================
   FLORES AMARILLAS — un viaje interestelar
   -------------------------------------------------------------------------
   Todo lo que quieras cambiar (frases, mensaje final, duracion) esta aqui
   arriba en CONFIG. Lo demas es el motor, no necesitas tocarlo.
   ========================================================================= */

const CONFIG = {

  // Frases que van saliendo junto a cada flor-estrella durante el viaje.
  // Puedes poner las que quieras, en el orden que quieras.
  frases: [
    'mi niña',
    'te amo',
    'te quiero',
    'mi bebé',
    'mi baby',
    'mi vida',
    'me encantas',
    'siempre te pienso',
    'eres mi persona favorita',
    'te extraño',
    'mi flor amarilla',
    'gracias por existir',
    'me haces feliz',
    'me haces sonreír',
    'Iluminas mi camino',
    'eres mi corazón'
  ],

  // Mensaje del final. La linea con `em: true` sale mas grande y en cursiva.
  mensajeFinal: {
    lineas: [
      { texto: 'No estoy ahí para dártelas en la mano,' },
      { texto: 'pero eso no me impide darte un detalle pequeño con lo que sé hacer.'},
      { texto: 'Te quiero, y la distancia no le quita nada a eso.', em: true }
    ],
    firma: 'Dani'
  },

  duracionFrase: 3000,    // ms que cada frase se queda en pantalla
  duracionViaje: 17000,   // ms que dura el viaje por el espacio
  duracionTierra: 7000,   // ms de la aproximacion + entrada a la Tierra
  musica: true,           // pon un archivo music.mp3 en esta carpeta y suena solo
  volumen: 0.22,          // 0.22 = 22%. De fondo, sin tapar nada. 0 a 1

  // cuantas flores y polvo de estrellas hay en el viaje. La pagina ya se
  // ajusta sola al tamano de pantalla; baja esto a 0.7 si algun celular
  // viejito se siente pesado, o subelo a 1.3 en una compu potente
  calidad: 1
};

/* =========================================================================
   1. Utilidades
   ========================================================================= */

const $ = (sel) => document.querySelector(sel);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInCubic = (t) => t * t * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DUR = {
  viaje: REDUCED ? 6000 : CONFIG.duracionViaje,
  tierra: REDUCED ? 3000 : CONFIG.duracionTierra
};

/* =========================================================================
   2. Canvas del espacio
   ========================================================================= */

const canvas = $('#space');
const ctx = canvas.getContext('2d');
const wordsLayer = $('#words');

let W = 0, H = 0, DPR = 1, CX = 0, CY = 0;
const FOV = 820;          // profundidad de referencia
const MAXZ = 1700;        // que tan lejos nacen las flores

function resize() {
  // pasar de ~1.75 no se nota y cuesta el doble de relleno por frame
  DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 1.75);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  CX = W / 2;
  CY = H / 2;
}

/* ---- sprites de flor (se dibujan una vez, luego solo se escalan) ---- */

const SPRITE_SIZE = 150;

function petalPath(g, len, wid) {
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-wid, -len * 0.34, -wid * 0.78, -len * 0.8, 0, -len);
  g.bezierCurveTo(wid * 0.78, -len * 0.8, wid, -len * 0.34, 0, 0);
  g.closePath();
}

function makeSprite(kind) {
  const S = SPRITE_SIZE;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const cx = S / 2, cy = S / 2;

  const cfg = {
    sun:     { n: 13, len: S * 0.44, wid: S * 0.105, core: S * 0.15, coreA: '#7a4517', coreB: '#2a1305' },
    gerbera: { n: 20, len: S * 0.42, wid: S * 0.060, core: S * 0.13, coreA: '#c9dd4f', coreB: '#41660f' },
    daisy:   { n: 9,  len: S * 0.38, wid: S * 0.130, core: S * 0.12, coreA: '#ffe37a', coreB: '#e08a04' }
  }[kind];

  // petalos
  g.save();
  g.translate(cx, cy);
  for (let i = 0; i < cfg.n; i++) {
    const a = (Math.PI * 2 / cfg.n) * i;
    g.save();
    g.rotate(a);
    const grad = g.createLinearGradient(0, 0, 0, -cfg.len);
    grad.addColorStop(0, '#e8940a');
    grad.addColorStop(0.45, '#ffd23f');
    grad.addColorStop(1, '#fff3b0');
    g.fillStyle = grad;
    petalPath(g, cfg.len, cfg.wid);
    g.fill();
    g.restore();
  }
  // segunda corona interna, da densidad al girasol
  if (kind === 'sun') {
    for (let i = 0; i < cfg.n; i++) {
      const a = (Math.PI * 2 / cfg.n) * i + Math.PI / cfg.n;
      g.save();
      g.rotate(a);
      g.fillStyle = 'rgba(240,167,10,.9)';
      petalPath(g, cfg.len * 0.72, cfg.wid * 0.9);
      g.fill();
      g.restore();
    }
  }
  g.restore();

  // corazon de la flor
  const core = g.createRadialGradient(cx - cfg.core * 0.3, cy - cfg.core * 0.3, 1, cx, cy, cfg.core);
  core.addColorStop(0, cfg.coreA);
  core.addColorStop(1, cfg.coreB);
  g.fillStyle = core;
  g.beginPath();
  g.arc(cx, cy, cfg.core, 0, Math.PI * 2);
  g.fill();

  return c;
}

const SPRITES = ['sun', 'gerbera', 'daisy'].map(makeSprite);

/* ---- la Tierra ----------------------------------------------------------
   Se dibuja UNA vez en un bitmap. Antes eran capas CSS con filtros SVG y
   blur encima; al escalarlas x15 el navegador las volvia a calcular en cada
   frame y ahi se iba la fluidez. Un bitmap ya hecho lo escala la tarjeta
   grafica sin pensarlo.                                                    */

const earthEl = $('#earth');
const TIERRA_PX = 860;

const tierraCanvas = document.createElement('canvas');
tierraCanvas.width = TIERRA_PX;
tierraCanvas.height = TIERRA_PX;
tierraCanvas.className = 'earth-bitmap';

function svgImagen(svg) {
  const im = new Image();
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return im;
}

// ruido fractal: continentes organicos sin tener que dibujar un mapa
const SVG_CONTINENTES = svgImagen(
  "<svg xmlns='http://www.w3.org/2000/svg' width='620' height='620' viewBox='0 0 300 300'>" +
  "<filter id='c' x='-20%' y='-20%' width='140%' height='140%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.011' numOctaves='5' seed='17'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 0.19 0 0 0 0 0.44 0 0 0 0 0.15 2.4 0 0 0 -1.02'/>" +
  "<feGaussianBlur stdDeviation='0.7'/></filter>" +
  "<filter id='d' x='-20%' y='-20%' width='140%' height='140%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4' seed='42'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 0.55 0 0 0 0 0.62 0 0 0 0 0.28 2.1 0 0 0 -1.25'/>" +
  "<feGaussianBlur stdDeviation='1'/></filter>" +
  "<rect width='300' height='300' filter='url(#c)'/>" +
  "<rect width='300' height='300' filter='url(#d)' opacity='0.5'/></svg>");

const SVG_NUBES = svgImagen(
  "<svg xmlns='http://www.w3.org/2000/svg' width='620' height='620' viewBox='0 0 300 300'>" +
  "<filter id='n' x='-20%' y='-20%' width='140%' height='140%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.016 0.038' numOctaves='4' seed='5'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -1.3'/>" +
  "<feGaussianBlur stdDeviation='1.4'/></filter>" +
  "<rect width='300' height='300' filter='url(#n)'/></svg>");

function pintarTierra() {
  const S = TIERRA_PX;
  const g = tierraCanvas.getContext('2d');
  const cx = S / 2, cy = S / 2, R = S * 0.335;
  const DOS_PI = Math.PI * 2;

  g.clearRect(0, 0, S, S);

  // atmosfera
  const halo = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.48);
  halo.addColorStop(0, 'rgba(130,195,255,.5)');
  halo.addColorStop(0.3, 'rgba(90,160,255,.2)');
  halo.addColorStop(1, 'rgba(60,120,220,0)');
  g.fillStyle = halo;
  g.beginPath();
  g.arc(cx, cy, R * 1.48, 0, DOS_PI);
  g.fill();

  g.save();
  g.beginPath();
  g.arc(cx, cy, R, 0, DOS_PI);
  g.clip();

  // oceano
  const oc = g.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.05, cx, cy, R * 1.05);
  oc.addColorStop(0, '#7fccff');
  oc.addColorStop(0.42, '#2e86d8');
  oc.addColorStop(0.78, '#134e8d');
  oc.addColorStop(1, '#082a55');
  g.fillStyle = oc;
  g.fillRect(cx - R, cy - R, R * 2, R * 2);

  if (SVG_CONTINENTES.naturalWidth) {
    g.globalAlpha = 0.96;
    g.drawImage(SVG_CONTINENTES, cx - R, cy - R, R * 2, R * 2);
  }
  if (SVG_NUBES.naturalWidth) {
    g.globalAlpha = 0.42;
    g.drawImage(SVG_NUBES, cx - R, cy - R, R * 2, R * 2);
  }
  g.globalAlpha = 1;

  // lado iluminado y terminador
  const luz = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx - R * 0.2, cy - R * 0.25, R * 1.5);
  luz.addColorStop(0, 'rgba(255,255,255,.16)');
  luz.addColorStop(0.35, 'rgba(255,255,255,0)');
  luz.addColorStop(0.72, 'rgba(2,6,20,.45)');
  luz.addColorStop(1, 'rgba(0,2,10,.95)');
  g.fillStyle = luz;
  g.fillRect(cx - R, cy - R, R * 2, R * 2);

  // filo de atmosfera sobre el borde
  const filo = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R);
  filo.addColorStop(0, 'rgba(150,210,255,0)');
  filo.addColorStop(1, 'rgba(160,215,255,.35)');
  g.fillStyle = filo;
  g.fillRect(cx - R, cy - R, R * 2, R * 2);

  g.restore();
}

pintarTierra();
earthEl.appendChild(tierraCanvas);

let texturasListas = 0;
[SVG_CONTINENTES, SVG_NUBES].forEach((im) => {
  const terminada = () => { if (++texturasListas === 2) pintarTierra(); };
  im.onload = terminada;
  im.onerror = terminada;
});

/* ---- campo de flores en 3D ---- */

const flowers = [];
const dust = [];
// en pantallas chicas no hace falta la misma cantidad de todo
const CARGA = clamp((window.innerWidth * window.innerHeight) / (1280 * 800), 0.5, 1.1) * (CONFIG.calidad || 1);
const FLOWER_COUNT = Math.round((REDUCED ? 40 : 92) * CARGA);
const DUST_COUNT = Math.round((REDUCED ? 60 : 180) * CARGA);

function spreadPoint(minR, maxR) {
  const a = rand(0, Math.PI * 2);
  const r = lerp(minR, maxR, Math.pow(Math.random(), 0.55));
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function resetFlower(f, deep) {
  const p = spreadPoint(140, 1250);
  f.x = p.x;
  f.y = p.y;
  f.z = deep ? rand(MAXZ * 0.35, MAXZ) : rand(MAXZ * 0.85, MAXZ);
  f.rot = rand(0, Math.PI * 2);
  f.spin = rand(-0.014, 0.014);
  f.sprite = SPRITES[(Math.random() * SPRITES.length) | 0];
  f.scale = rand(0.45, 1.25);
  f.radial = Math.hypot(p.x, p.y);
  return f;
}

for (let i = 0; i < FLOWER_COUNT; i++) flowers.push(resetFlower({}, true));

for (let i = 0; i < DUST_COUNT; i++) {
  const p = spreadPoint(60, 1600);
  dust.push({ x: p.x, y: p.y, z: rand(20, MAXZ), s: rand(0.6, 1.8) });
}

/* ---- frases flotantes ---------------------------------------------------
   Antes cada frase iba pegada a la profundidad de su flor: cuando el viaje
   aceleraba, la flor cruzaba la pantalla en medio segundo y la frase no se
   alcanzaba a leer. Ahora nacen donde pasa una flor y despues viven su
   propia vida de ~3 segundos, vaya el viaje lento o a toda madre.          */

const MAX_PALABRAS = (REDUCED || window.innerWidth < 700) ? 2 : 4;
const VIDA_PALABRA = CONFIG.duracionFrase || 3000;
const palabras = [];
let frasesIdx = 0;
let proximaFrase = 0;

function lejosDeLasOtras(x, y) {
  const dMin = Math.max(150, Math.min(W, H) * 0.26);
  for (const p of palabras) {
    // ni cerca, ni a la misma altura: dos frases en el mismo renglon no se leen
    if (Math.abs(p.y - y) < 64 && Math.abs(p.x - x) < W * 0.55) return false;
    if (Math.hypot(p.x - x, p.y - y) < dMin) return false;
  }
  return true;
}

function puntoDeNacimiento() {
  const minWH = Math.min(W, H);
  const dentro = (r) => r > minWH * 0.13 && r < minWH * 0.58;

  // buscamos entre las flores que van pasando, empezando en una al azar para
  // no elegir siempre la misma y terminar apilando todas las frases encima
  const inicio = (Math.random() * flowers.length) | 0;

  for (let i = 0; i < flowers.length; i++) {
    const f = flowers[(inicio + i) % flowers.length];
    if (f.z < 260 || f.z > MAXZ * 0.8) continue;

    const k = FOV / f.z;
    const dx = f.x * k;
    const dy = f.y * k;
    const r = Math.hypot(dx, dy);
    if (!dentro(r)) continue;

    const punto = { x: CX + dx, y: CY + dy, dx, dy, r };
    if (lejosDeLasOtras(punto.x, punto.y)) return punto;
  }

  // si ninguna flor servia, un punto libre del anillo
  for (let intento = 0; intento < 14; intento++) {
    const a = rand(0, Math.PI * 2);
    const r = minWH * rand(0.2, 0.5);
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r;
    if (lejosDeLasOtras(CX + dx, CY + dy)) return { x: CX + dx, y: CY + dy, dx, dy, r };
  }

  // todo ocupado: mejor esperar un momento que encimar frases
  return null;
}

function soltarPalabra(now) {
  if (palabras.length >= MAX_PALABRAS) return;

  const cuna = puntoDeNacimiento();
  if (!cuna) return false;

  const el = document.createElement('span');
  el.className = 'word';
  el.textContent = CONFIG.frases[frasesIdx % CONFIG.frases.length];
  frasesIdx++;

  let tam = clamp(Math.min(W, H) * 0.052, 23, 46);
  el.style.fontSize = tam + 'px';
  wordsLayer.appendChild(el);

  // si la frase es larga se encoge sola en vez de salirse de la pantalla
  // (la 1.2 es porque la frase crece un 20% mientras vive)
  const anchoMax = (W * 0.9) / 1.2;
  const ancho = el.offsetWidth;
  if (ancho > anchoMax) {
    tam = Math.max(13, tam * (anchoMax / ancho));
    el.style.fontSize = tam + 'px';
  }
  const medio = el.offsetWidth / 2;   // para que nunca se le corte una orilla

  const norm = Math.max(1, cuna.r);
  palabras.push({
    el,
    x: cuna.x,
    y: cuna.y,
    // se van abriendo hacia afuera como todo lo demas, pero despacio
    vx: (cuna.dx / norm) * rand(24, 54),
    vy: (cuna.dy / norm) * rand(24, 54),
    t0: now,
    tam,
    medio
  });
  return true;
}

function moverPalabras(now, dt) {
  if (state.fase === 'space' && now >= proximaFrase) {
    const puesta = soltarPalabra(now);
    proximaFrase = now + (puesta ? rand(700, 1050) : 280);
  }

  for (let i = palabras.length - 1; i >= 0; i--) {
    const p = palabras[i];
    const vida = (now - p.t0) / VIDA_PALABRA;

    if (vida >= 1) {
      p.el.remove();
      palabras.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const a = Math.min(clamp(vida / 0.13, 0, 1), clamp((1 - vida) / 0.24, 0, 1));
    const escala = 1 + vida * 0.2;

    // el margen depende del ancho real de la frase, no de un numero fijo
    const medio = p.medio * escala + 10;
    const limite = Math.max(medio, W - medio);

    p.el.style.opacity = (a * state.alphaFlores).toFixed(3);
    p.el.style.fontSize = (p.tam * escala).toFixed(1) + 'px';
    p.el.style.transform = 'translate(-50%,-50%) translate(' +
      clamp(p.x, Math.min(medio, W / 2), limite).toFixed(1) + 'px,' +
      clamp(p.y, 40, H - 40).toFixed(1) + 'px)';
  }
}

function limpiarPalabras() {
  for (const p of palabras) p.el.remove();
  palabras.length = 0;
}

/* =========================================================================
   3. Estado / linea de tiempo
   ========================================================================= */

const state = {
  fase: 'intro',       // intro | space | earth | garden | final
  tFase: 0,
  speed: 1.4,
  alphaFlores: 1,
  running: false
};

function setFase(nombre) {
  state.fase = nombre;
  state.tFase = performance.now();
  document.body.classList.remove('phase-space', 'phase-earth', 'phase-garden', 'phase-final');
  document.body.classList.add('phase-' + nombre);
}

/* =========================================================================
   4. Bucle del viaje
   ========================================================================= */

function project(o) {
  const k = FOV / o.z;
  return { k, sx: CX + o.x * k, sy: CY + o.y * k };
}

function drawDust(paso) {
  // agrupamos los trazos por brillo: 5 llamadas a stroke en vez de ~180
  const tramos = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  const anchos = [0.6, 0.9, 1.3, 1.8, 2.4];

  for (const d of dust) {
    d.z -= paso;
    if (d.z < 1) {
      const p = spreadPoint(60, 1600);
      d.x = p.x; d.y = p.y; d.z = MAXZ;
    }
    const k = FOV / d.z;
    const sx = CX + d.x * k;
    const sy = CY + d.y * k;
    if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;

    const kPrev = FOV / (d.z + paso * 2.2);
    const a = clamp(k * 0.85, 0.05, 0.9);
    const b = clamp((a * 5) | 0, 0, 4);

    tramos[b].moveTo(CX + d.x * kPrev, CY + d.y * kPrev);
    tramos[b].lineTo(sx, sy);
  }

  ctx.lineCap = 'round';
  for (let b = 0; b < 5; b++) {
    ctx.strokeStyle = 'rgba(255,252,235,' + (((b + 0.6) / 5) * state.alphaFlores).toFixed(3) + ')';
    ctx.lineWidth = anchos[b];
    ctx.stroke(tramos[b]);
  }
}

function drawFlowers(paso) {
  // mas alla de este tamano la flor ya solo es una mancha que cuesta rellenar
  const tope = Math.max(W, H) * 1.7;

  for (const f of flowers) {
    f.z -= paso;
    f.rot += f.spin;

    if (f.z < 40) { resetFlower(f, false); continue; }

    const k = FOV / f.z;
    const sx = CX + f.x * k;
    const sy = CY + f.y * k;
    const size = f.scale * 120 * k;

    if (size > tope || size < 1.5) continue;
    if (sx < -size || sx > W + size || sy < -size || sy > H + size) continue;

    const cerca = clamp((MAXZ - f.z) / (MAXZ * 0.5), 0, 1);      // nace de la oscuridad
    const pasando = clamp((tope - size) / (tope * 0.4), 0, 1);   // y se difumina al pasar
    ctx.globalAlpha = clamp(k * 2.2, 0, 1) * cerca * pasando * state.alphaFlores;
    ctx.translate(sx, sy);
    ctx.rotate(f.rot);
    ctx.drawImage(f.sprite, -size / 2, -size / 2, size, size);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  ctx.globalAlpha = 1;
}

function frame() {
  if (!state.running) return;
  try {
    pintar();
  } catch (err) {
    // pase lo que pase, ella tiene que ver el jardin
    console.error(err);
    saltar();
    return;
  }
  requestAnimationFrame(frame);
}

function pintar() {
  const now = performance.now();
  const elapsed = now - state.tFase;

  // dt real: el movimiento ya no depende de cuantos frames logre el equipo,
  // asi se ve igual de rapido en una pantalla de 60Hz que en una de 120Hz,
  // y si se cae un frame el viaje no se traba, solo da un paso mas grande
  const dt = clamp((now - (state.tPrev || now)) / 1000, 0, 0.05);
  state.tPrev = now;

  if (state.fase === 'space') {
    const p = clamp(elapsed / DUR.viaje, 0, 1);
    state.speed = lerp(1.6, 30, easeInCubic(p)) + Math.sin(now * 0.0012) * 0.6;

    // la Tierra ya se ve a lo lejos y se va acercando durante todo el viaje
    earthEl.style.transform = 'scale(' + lerp(0.008, 0.03, p * p).toFixed(4) + ')';

    if (p >= 1) entrarATierra();

  } else if (state.fase === 'earth') {
    const p = clamp(elapsed / DUR.tierra, 0, 1);
    state.speed = lerp(30, 7, easeOutCubic(p));

    // la Tierra crece hasta tragarse la pantalla. Escribimos el transform
    // directo en el elemento: tocar una variable CSS en :root obliga al
    // navegador a recalcular estilos de toda la pagina en cada frame
    const escala = 0.03 * Math.pow(520, Math.pow(p, 1.55));
    earthEl.style.transform = 'scale(' + escala.toFixed(4) + ') rotate(' + (p * 7).toFixed(2) + 'deg)';

    // las flores se apagan antes, para que el tramo final sea solo la Tierra
    state.alphaFlores = clamp(1 - (p - 0.32) / 0.34, 0, 1);

    if (p >= 1) aterrizar();
  }

  moverPalabras(now, dt);

  const paso = state.speed * dt * 60;

  // borrado parcial: a mas velocidad, mas estela (sensacion de viaje)
  const fade = clamp(1.05 - state.speed / 44, 0.34, 1);
  if (fade >= 0.999) {
    ctx.clearRect(0, 0, W, H);
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + fade.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  if (state.alphaFlores > 0.01) {
    drawDust(paso);
    drawFlowers(paso);
  } else {
    ctx.clearRect(0, 0, W, H);
  }
}

/* =========================================================================
   5. Transiciones
   ========================================================================= */

function entrarATierra() {
  setFase('earth');
  $('#earthStage').setAttribute('aria-hidden', 'false');
}

function aterrizar() {
  const flash = $('#flash');
  flash.style.transition = 'opacity .5s ease';
  flash.style.opacity = '1';

  setTimeout(() => {
    abrirJardin();
    setFase('garden');
    $('#garden').setAttribute('aria-hidden', 'false');
    $('#earthStage').setAttribute('aria-hidden', 'true');

    flash.style.transition = 'opacity 1.6s ease';
    flash.style.opacity = '0';

    // deja de pintar el canvas, el jardin es puro CSS/SVG
    setTimeout(() => {
      state.running = false;
      ctx.clearRect(0, 0, W, H);
      limpiarPalabras();
    }, 1400);

    // el mensaje llega cuando las flores terminaron de crecer
    setTimeout(mostrarMensajeFinal, REDUCED ? 2600 : 6400);
  }, 520);
}

function saltar() {
  state.running = false;
  abrirJardin();
  setFase('garden');
  $('#garden').setAttribute('aria-hidden', 'false');
  ctx.clearRect(0, 0, W, H);
  limpiarPalabras();
  $('#btnSkip').hidden = true;
  setTimeout(mostrarMensajeFinal, REDUCED ? 2600 : 6400);
}

/* =========================================================================
   6. El jardin
   ========================================================================= */

const field = $('#field');

function flowerMarkup(tipo, bend) {
  const headY = 46;
  const baseY = 150;
  const ctrl1 = 50 + bend;
  const ctrl2 = 50 - bend * 0.6;
  const stem = 'M50 ' + baseY + ' C' + ctrl1 + ' 118, ' + ctrl2 + ' 82, 50 ' + headY;

  const forma = {
    sun:     'M50 46 C43 24 44 11 50 1 C56 11 57 24 50 46Z',
    gerbera: 'M50 46 C47 30 47 19 50 11 C53 19 53 30 50 46Z',
    daisy:   'M50 46 C41 33 41 21 50 14 C59 21 59 33 50 46Z'
  }[tipo];

  const n = tipo === 'sun' ? 14 : tipo === 'gerbera' ? 22 : 10;
  const fills = ['url(#petalGold)', 'url(#petalGold2)', 'url(#petalGold3)'];

  let petalos = '';
  for (let i = 0; i < n; i++) {
    const ang = (360 / n) * i;
    petalos += '<path class="petal" d="' + forma + '" fill="' + fills[i % 3] +
               '" transform="rotate(' + ang.toFixed(1) + ' 50 ' + headY + ')"/>';
  }
  if (tipo === 'sun') {
    // corona interna mas corta: le da cuerpo al girasol sin despegarse del centro
    const formaCorta = 'M50 46 C45 31 46 21 50 14 C54 21 55 31 50 46Z';
    for (let i = 0; i < n; i++) {
      const ang = (360 / n) * i + 180 / n;
      petalos += '<path class="petal" d="' + formaCorta + '" fill="url(#petalGold2)" opacity=".92"' +
                 ' transform="rotate(' + ang.toFixed(1) + ' 50 ' + headY + ')"/>';
    }
  }

  const coreR = tipo === 'sun' ? 14 : tipo === 'gerbera' ? 12 : 10;
  const coreFill = tipo === 'gerbera' ? 'url(#centerGerbera)' : 'url(#centerSun)';

  return '' +
    '<svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMax meet">' +
      '<path class="stem" d="' + stem + '" fill="none" stroke="url(#stemGreen)" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path class="leaf" d="M50 120 C33 111 21 118 16 130 C30 137 44 131 50 120Z" fill="url(#leafGreen)"/>' +
      '<path class="leaf leaf-r" d="M50 98 C67 89 79 96 84 108 C70 115 56 109 50 98Z" fill="url(#leafGreen)"/>' +
      '<g class="head">' + petalos +
        '<circle cx="50" cy="' + headY + '" r="' + coreR + '" fill="' + coreFill + '"/>' +
        '<circle cx="50" cy="' + headY + '" r="' + (coreR * 0.55) + '" fill="rgba(0,0,0,.18)"/>' +
        '<circle cx="' + (50 - coreR * 0.3) + '" cy="' + (headY - coreR * 0.35) + '" r="' + (coreR * 0.22) +
        '" fill="rgba(255,255,255,.22)"/>' +
      '</g>' +
    '</svg>';
}

function crearFlor({ x, bottom, width, delay, tipo, depth, sway }) {
  const el = document.createElement('div');
  el.className = 'bloom depth-' + depth;
  el.style.setProperty('--x', x + '%');
  el.style.setProperty('--b', bottom + '%');
  el.style.setProperty('--w', width + 'vmin');
  el.style.animationDuration = sway.toFixed(1) + 's';
  el.style.animationDelay = delay.toFixed(2) + 's';
  el.innerHTML = flowerMarkup(tipo, rand(-13, 13));
  field.appendChild(el);

  // medimos el tallo real para que crezca de abajo hacia arriba sin saltos
  const stem = el.querySelector('.stem');
  const len = Math.ceil(stem.getTotalLength());
  stem.style.strokeDasharray = len;
  stem.style.strokeDashoffset = len;
  stem.style.animationDelay = delay.toFixed(2) + 's';

  el.querySelectorAll('.leaf').forEach((hoja) => {
    hoja.style.animationDelay = (delay + 0.55).toFixed(2) + 's';
  });
  el.querySelector('.head').style.animationDelay = (delay + 1.05).toFixed(2) + 's';

  return el;
}

/* El jardin son ~110 elementos con SVG adentro. Construirlos de un jalon
   justo en la transicion se sentia como un tiron en el peor momento, asi que
   ahora se van armando durante el viaje, en ratitos de 6ms, con todas las
   animaciones en pausa hasta que toca florecer.                            */

const tareasJardin = [];
let jardinPreparado = false;

function prepararJardin() {
  if (jardinPreparado) return;
  jardinPreparado = true;

  const garden = $('#garden');
  garden.classList.add('esperando');

  // en pantallas verticales las flores se ven chiquitas: las agrandamos y suben
  const vertical = window.innerHeight / window.innerWidth > 1.3;
  const chica = window.innerWidth < 700;
  const ESC = vertical ? 1.55 : 1;
  const SUBE = vertical ? 7 : 0;

  const filas = [
    { n: REDUCED ? 10 : 26, bottom: [16, 23], width: [7, 11],  delay: [0.0, 1.2], depth: 'far',  tipos: ['daisy', 'gerbera', 'sun'] },
    { n: REDUCED ? 8 : 18,  bottom: [5, 14],  width: [13, 19], delay: [0.7, 2.1], depth: 'mid',  tipos: ['gerbera', 'sun', 'daisy'] },
    { n: REDUCED ? 6 : 12,  bottom: [-14, 0], width: [22, 34], delay: [1.7, 3.3], depth: 'near', tipos: ['sun', 'gerbera', 'daisy'] }
  ];

  filas.forEach((fila) => {
    for (let i = 0; i < fila.n; i++) {
      // repartidas con algo de azar para que no se vean alineadas
      const x = ((i + 0.5) / fila.n) * 100 + rand(-4.5, 4.5);
      tareasJardin.push(() => crearFlor({
        x: clamp(x, -4, 104).toFixed(2),
        bottom: (rand(fila.bottom[0], fila.bottom[1]) + SUBE).toFixed(2),
        width: (rand(fila.width[0], fila.width[1]) * ESC).toFixed(2),
        delay: rand(fila.delay[0], fila.delay[1]),
        tipo: pick(fila.tipos),
        depth: fila.depth,
        sway: rand(4.5, 8)
      }));
    }
  });

  // dos flores grandes a cada lado: enmarcan el mensaje sin taparlo
  [rand(3, 17), rand(83, 97), rand(-2, 12), rand(88, 102)].forEach((x, i) => {
    tareasJardin.push(() => crearFlor({
      x: x.toFixed(2),
      bottom: (rand(-20, -8) + SUBE).toFixed(2),
      width: (rand(32, 44) * ESC).toFixed(2),
      delay: rand(2.4, 3.6),
      tipo: i % 2 ? 'gerbera' : 'sun',
      depth: 'near',
      sway: rand(5, 8)
    }));
  });

  // nube blanca tipo gypsophila, como en la foto
  for (let i = 0; i < (REDUCED ? 5 : 11); i++) {
    tareasJardin.push(() => {
      const b = document.createElement('div');
      b.className = 'baby';
      b.style.setProperty('--x', rand(2, 98).toFixed(2) + '%');
      b.style.setProperty('--b', (rand(8, 24) + SUBE).toFixed(2) + '%');
      b.style.setProperty('--w', (rand(7, 15) * ESC).toFixed(1) + 'vmin');
      b.style.animationDelay = (rand(1.2, 3.2) + 1.3).toFixed(2) + 's, 0s';
      field.appendChild(b);
    });
  }

  // pasto en primer plano: esconde las bases y da profundidad
  const fg = $('#foreground');
  const hojas = REDUCED ? 26 : (chica ? 40 : 64);
  for (let i = 0; i < hojas; i++) {
    tareasJardin.push(() => {
      const hoja = document.createElement('i');
      hoja.className = 'blade';
      const alto = rand(4, 15);
      hoja.style.left = rand(-2, 102).toFixed(2) + '%';
      hoja.style.height = alto.toFixed(2) + 'vh';
      hoja.style.width = rand(0.7, 2.4).toFixed(2) + 'vmin';
      hoja.style.setProperty('--tilt', rand(-26, 26).toFixed(1) + 'deg');
      hoja.style.setProperty('--tono', Math.round(rand(88, 122)) + 'deg');
      const retraso = rand(0, 3);
      hoja.style.animationDuration = '1.2s, ' + rand(3.5, 7).toFixed(1) + 's';
      hoja.style.animationDelay = retraso.toFixed(2) + 's, ' + (retraso + 1.2).toFixed(2) + 's';
      hoja.style.zIndex = alto > 10 ? 3 : 1;
      fg.appendChild(hoja);
    });
  }

  // polen flotando en la luz
  if (!REDUCED) {
    const pollen = $('#pollen');
    for (let i = 0; i < (chica ? 16 : 30); i++) {
      tareasJardin.push(() => {
        const m = document.createElement('div');
        m.className = 'mote';
        const t = rand(3, 8);
        m.style.width = t + 'px';
        m.style.height = t + 'px';
        m.style.left = rand(0, 100).toFixed(1) + '%';
        m.style.top = rand(35, 95).toFixed(1) + '%';
        m.style.setProperty('--dx', rand(-120, 120).toFixed(0) + 'px');
        m.style.setProperty('--dy', rand(-260, -90).toFixed(0) + 'px');
        m.style.animationDuration = rand(9, 18).toFixed(1) + 's';
        m.style.animationDelay = rand(0, 12).toFixed(1) + 's';
        pollen.appendChild(m);
      });
    }
  }
}

function armarPorRatitos() {
  const t0 = performance.now();
  while (tareasJardin.length && performance.now() - t0 < 6) tareasJardin.shift()();
  if (tareasJardin.length) setTimeout(armarPorRatitos, 70);
}

function terminarJardin() {
  prepararJardin();
  while (tareasJardin.length) tareasJardin.shift()();
}

function abrirJardin() {
  terminarJardin();
  // quitar la pausa arranca todas las animaciones desde cero, a la vez
  $('#garden').classList.remove('esperando');
}

/* =========================================================================
   7. Mensaje final
   ========================================================================= */

function mostrarMensajeFinal() {
  const card = $('#finalCard');
  if (card.childElementCount) return;

  CONFIG.mensajeFinal.lineas.forEach((l, i) => {
    const p = document.createElement('p');
    p.className = 'final-line' + (l.em ? ' em' : '');
    p.style.animationDelay = (0.4 + i * 0.9).toFixed(2) + 's';
    p.textContent = l.texto;
    card.appendChild(p);
  });

  if (CONFIG.mensajeFinal.firma) {
    const s = document.createElement('span');
    s.className = 'final-sign';
    s.style.animationDelay = (0.4 + CONFIG.mensajeFinal.lineas.length * 0.9).toFixed(2) + 's';
    s.textContent = CONFIG.mensajeFinal.firma;
    card.appendChild(s);
  }

  setFase('final');
  $('#final').setAttribute('aria-hidden', 'false');
  $('#btnSkip').hidden = true;
}

/* =========================================================================
   8. Arranque
   ========================================================================= */

function empezar() {
  if (state.running) return;
  document.body.classList.add('started');
  $('#btnSkip').hidden = false;

  setFase('space');
  state.running = true;
  requestAnimationFrame(frame);

  // el jardin se va armando en segundo plano mientras ella viaja
  setTimeout(() => { prepararJardin(); armarPorRatitos(); }, 1200);

  if (CONFIG.musica) sonarMusica();
}

/* La musica entra de fondo, bajita, y sube sola en unos 3 segundos.
   Ojo con el iPhone: Safari NO deja cambiar el volumen por codigo (la
   propiedad volume es de solo lectura, manda el boton del telefono), asi
   que ahi el volumen se controla con Web Audio. Si eso no se puede, al
   menos suena.                                                            */
function sonarMusica() {
  const bgm = $('#bgm');
  const tope = clamp(CONFIG.volumen === undefined ? 0.22 : CONFIG.volumen, 0, 1);
  if (tope <= 0) return;

  const arrancar = () => {
    const p = bgm.play();
    if (p && p.catch) p.catch(() => {});
  };

  // reintento por si el navegador bloquea el audio: al primer toque de ella
  const reintento = () => {
    if (bgm.paused) arrancar();
    document.removeEventListener('pointerdown', reintento);
    document.removeEventListener('touchstart', reintento);
  };
  document.addEventListener('pointerdown', reintento);
  document.addEventListener('touchstart', reintento);

  // ¿este navegador deja mover el volumen? (Edge si, Safari de iPhone no)
  bgm.volume = 0.5;
  const mandaElVolumen = Math.abs(bgm.volume - 0.5) < 0.05;

  if (mandaElVolumen) {
    bgm.volume = 0;
    arrancar();
    const pasos = 30;
    let i = 0;
    const subir = setInterval(() => {
      i++;
      try { bgm.volume = tope * (i / pasos); } catch (e) {}
      if (i >= pasos) clearInterval(subir);
    }, 100);
    return;
  }

  // iPhone: el volumen se maneja con una perilla de Web Audio.
  // Solo si la pagina esta publicada (en file:// el audio quedaria mudo).
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC && location.protocol !== 'file:') {
    try {
      const audio = new AC();
      const fuente = audio.createMediaElementSource(bgm);
      const perilla = audio.createGain();
      perilla.gain.value = 0.0001;
      fuente.connect(perilla);
      perilla.connect(audio.destination);
      if (audio.state === 'suspended' && audio.resume) audio.resume();
      arrancar();
      perilla.gain.setValueAtTime(0.0001, audio.currentTime);
      perilla.gain.exponentialRampToValueAtTime(tope, audio.currentTime + 3);
      return;
    } catch (e) { /* si falla, que al menos se escuche */ }
  }

  arrancar();
}

/* Atajos para revisar sin ver todo el viaje cada vez:
     index.html?ir=jardin   -> arranca directo en el jardin
     index.html?ir=tierra   -> arranca en la llegada a la Tierra
     index.html?rapido=1    -> mismo viaje, en la mitad de tiempo           */
function atajos() {
  const q = new URLSearchParams(location.search);

  if (q.get('rapido') === '1') {
    DUR.viaje = 5000;
    DUR.tierra = 2500;
  }

  const ir = q.get('ir');
  if (!ir) return;

  if (ir === 'espacio') {
    empezar();
  } else if (ir === 'jardin') {
    document.body.classList.add('started');
    saltar();
  } else if (ir === 'tierra') {
    empezar();
    setFase('earth');
    $('#earthStage').setAttribute('aria-hidden', 'false');
  }
}

// sin music.mp3 no tiene sentido pedirle que suba el volumen
const bgmEl = $('#bgm');
bgmEl.addEventListener('error', () => {
  const hint = $('#hintAudio');
  if (hint) hint.style.display = 'none';
  CONFIG.musica = false;
});

$('#btnStart').addEventListener('click', empezar);
$('#btnSkip').addEventListener('click', saltar);
$('#btnReplay').addEventListener('click', () => {
  location.href = location.pathname;
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

resize();
ctx.clearRect(0, 0, W, H);
atajos();
