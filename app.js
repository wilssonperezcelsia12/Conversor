const crsCatalog = [
  {
    code: "EPSG:4326",
    name: "WGS 84 geograficas",
    proj4: "+proj=longlat +datum=WGS84 +no_defs +type=crs",
    axis: "X = longitud, Y = latitud",
  },
  {
    code: "EPSG:4686",
    name: "MAGNA-SIRGAS geograficas",
    proj4: "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs",
    axis: "X = longitud, Y = latitud",
  },
  {
    code: "EPSG:3857",
    name: "WGS 84 / Web Mercator",
    proj4: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:9377",
    name: "MAGNA-SIRGAS / Origen-Nacional Colombia",
    proj4: "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:3116",
    name: "MAGNA-SIRGAS / Colombia Bogota",
    proj4: "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32617",
    name: "WGS 84 / UTM zona 17N",
    proj4: "+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32618",
    name: "WGS 84 / UTM zona 18N",
    proj4: "+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32619",
    name: "WGS 84 / UTM zona 19N",
    proj4: "+proj=utm +zone=19 +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32717",
    name: "WGS 84 / UTM zona 17S",
    proj4: "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32718",
    name: "WGS 84 / UTM zona 18S",
    proj4: "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
  {
    code: "EPSG:32719",
    name: "WGS 84 / UTM zona 19S",
    proj4: "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs +type=crs",
    axis: "X = este, Y = norte en metros",
  },
];

const sourceCrs = document.querySelector("#sourceCrs");
const targetCrs = document.querySelector("#targetCrs");
const form = document.querySelector("#converterForm");
const formMessage = document.querySelector("#formMessage");
const libraryDot = document.querySelector("#libraryDot");
const libraryStatus = document.querySelector("#libraryStatus");
const xInput = document.querySelector("#xInput");
const yInput = document.querySelector("#yInput");
const zInput = document.querySelector("#zInput");
const precisionInput = document.querySelector("#precisionInput");
const xResult = document.querySelector("#xResult");
const yResult = document.querySelector("#yResult");
const pairResult = document.querySelector("#pairResult");
const crsInfo = document.querySelector("#crsInfo");

let lastResult = null;

function message(element, text, type = "") {
  element.className = `message ${type}`.trim();
  element.textContent = text;
}

function getCrs(code) {
  return crsCatalog.find((item) => item.code === code);
}

function addDefinition(item) {
  if (!window.proj4) return;
  if (item.proj4) proj4.defs(item.code, item.proj4);
}

function renderCrsOptions() {
  const options = crsCatalog
    .map((item) => `<option value="${item.code}">${item.code} - ${item.name}</option>`)
    .join("");
  const currentSource = sourceCrs.value || "EPSG:4326";
  const currentTarget = targetCrs.value || "EPSG:9377";
  sourceCrs.innerHTML = options;
  targetCrs.innerHTML = options;
  sourceCrs.value = getCrs(currentSource) ? currentSource : "EPSG:4326";
  targetCrs.value = getCrs(currentTarget) ? currentTarget : "EPSG:9377";
  renderCrsInfo();
}

function renderCrsInfo() {
  const origin = getCrs(sourceCrs.value);
  const target = getCrs(targetCrs.value);
  crsInfo.innerHTML = `
    <div><code>${origin.code}</code> ${origin.axis}</div>
    <div><code>${target.code}</code> ${target.axis}</div>
  `;
}

function ensureProj4Ready() {
  if (!window.proj4) {
    throw new Error("Proj4js no esta disponible. Revisa que el archivo proj4.js este junto a index.html.");
  }
}

function formatNumber(value, precision) {
  if (!Number.isFinite(value)) return "-";
  return Number(value.toFixed(precision)).toLocaleString("en-US", {
    maximumFractionDigits: precision,
    useGrouping: false,
  });
}

function parseCoordinate(input, label) {
  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} debe ser un numero valido.`);
  }
  return value;
}

function convert() {
  ensureProj4Ready();
  const from = sourceCrs.value;
  const to = targetCrs.value;
  const x = parseCoordinate(xInput, "X");
  const y = parseCoordinate(yInput, "Y");
  const z = zInput.value.trim() === "" ? null : parseCoordinate(zInput, "Z");
  const precision = Math.min(12, Math.max(0, Number(precisionInput.value) || 6));
  const coordinate = z === null ? [x, y] : [x, y, z];
  const transformed = proj4(from, to, coordinate);
  const formattedX = formatNumber(transformed[0], precision);
  const formattedY = formatNumber(transformed[1], precision);
  const formattedZ = transformed.length > 2 && Number.isFinite(transformed[2])
    ? formatNumber(transformed[2], precision)
    : null;

  xResult.textContent = formattedX;
  yResult.textContent = formattedY;
  pairResult.textContent = formattedZ ? `${formattedX}, ${formattedY}, ${formattedZ}` : `${formattedX}, ${formattedY}`;
  lastResult = {
    from,
    to,
    x: transformed[0],
    y: transformed[1],
    z: transformed[2],
    pair: pairResult.textContent,
  };
  message(formMessage, `Conversion realizada de ${from} a ${to}.`, "success");
}

function initialize() {
  renderCrsOptions();
  if (!window.proj4) {
    libraryStatus.textContent = "Proj4js no cargo";
    message(formMessage, "No se pudo cargar Proj4js. Verifica que proj4.js este en la misma carpeta que index.html.", "error");
    return;
  }
  crsCatalog.forEach(addDefinition);
  libraryDot.classList.add("ready");
  libraryStatus.textContent = "Proj4js listo";
  message(formMessage, "Listo para convertir.", "success");
  renderCrsInfo();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    convert();
  } catch (error) {
    message(formMessage, error.message, "error");
  }
});

document.querySelector("#swapButton").addEventListener("click", () => {
  const currentSource = sourceCrs.value;
  sourceCrs.value = targetCrs.value;
  targetCrs.value = currentSource;
  renderCrsInfo();
});

document.querySelector("#clearButton").addEventListener("click", () => {
  form.reset();
  targetCrs.value = "EPSG:9377";
  xResult.textContent = "-";
  yResult.textContent = "-";
  pairResult.textContent = "-";
  lastResult = null;
  renderCrsInfo();
  message(formMessage, "Formulario limpio.", "");
});

document.querySelector("#copyButton").addEventListener("click", async () => {
  if (!lastResult) {
    message(formMessage, "Primero realiza una conversion.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(lastResult.pair);
    message(formMessage, "Resultado copiado al portapapeles.", "success");
  } catch {
    message(formMessage, "No se pudo copiar automaticamente. Selecciona el resultado y copialo manualmente.", "error");
  }
});

document.querySelector("#reuseButton").addEventListener("click", () => {
  if (!lastResult) {
    message(formMessage, "Primero realiza una conversion.", "error");
    return;
  }
  xInput.value = lastResult.x;
  yInput.value = lastResult.y;
  if (Number.isFinite(lastResult.z)) zInput.value = lastResult.z;
  sourceCrs.value = lastResult.to;
  renderCrsInfo();
  message(formMessage, "El resultado quedo cargado como nueva coordenada origen.", "success");
});

sourceCrs.addEventListener("change", renderCrsInfo);
targetCrs.addEventListener("change", renderCrsInfo);
window.addEventListener("load", initialize);

// Register a service worker to enable offline usage (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        console.log('Service worker registered.', reg);
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });
}
