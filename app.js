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

// Global state for DOM elements
let sourceCrs, targetCrs, form, formMessage, libraryDot, libraryStatus, appVersionEl, themeToggleButton;
let xInput, yInput, zInput, precisionInput, xResult, yResult, pairResult, crsInfo;

const APP_VERSION = 'v1.1';

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
  } catch (e) { }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  if (themeToggleButton) {
    themeToggleButton.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
    themeToggleButton.setAttribute('aria-pressed', String(isDark));
  }

  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#087f8c');
  }

  try {
    localStorage.setItem('theme', theme);
  } catch (e) { }
}

function handleThemeToggle() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

// Try to read VERSION from sw.js so sw.js remains the single source of truth
async function fetchVersionFromServiceWorkerFile() {
  try {
    const res = await fetch('sw.js?__ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo descargar sw.js');
    const text = await res.text();
    const m = text.match(/const\s+VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
    if (m && m[1]) return m[1];
  } catch (e) {
    // ignore and fallback
  }
  return null;
}
function initialize() {
  // Capture all elements
  sourceCrs = document.querySelector("#sourceCrs");
  targetCrs = document.querySelector("#targetCrs");
  form = document.querySelector("#converterForm");
  formMessage = document.querySelector("#formMessage");
  libraryDot = document.querySelector("#libraryDot");
  libraryStatus = document.querySelector("#libraryStatus");
  appVersionEl = document.querySelector('#appVersion');
  themeToggleButton = document.querySelector('#themeToggleButton');
  xInput = document.querySelector("#xInput");
  yInput = document.querySelector("#yInput");
  zInput = document.querySelector("#zInput");
  precisionInput = document.querySelector("#precisionInput");
  xResult = document.querySelector("#xResult");
  yResult = document.querySelector("#yResult");
  pairResult = document.querySelector("#pairResult");
  crsInfo = document.querySelector("#crsInfo");

  // Initialize Theme
  applyTheme(getStoredTheme());
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', handleThemeToggle);
  }

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
  if (appVersionEl) appVersionEl.textContent = APP_VERSION;
  fetchVersionFromServiceWorkerFile().then((v) => {
    if (v && appVersionEl) appVersionEl.textContent = v;
  });
}

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        convert();
      } catch (error) {
        message(formMessage, error.message, "error");
      }
    });
  }

  const swapBtn = document.querySelector("#swapButton");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const currentSource = sourceCrs.value;
      sourceCrs.value = targetCrs.value;
      targetCrs.value = currentSource;
      renderCrsInfo();
    });
  }

  const clearBtn = document.querySelector("#clearButton");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      form.reset();
      targetCrs.value = "EPSG:9377";
      xResult.textContent = "-";
      yResult.textContent = "-";
      pairResult.textContent = "-";
      lastResult = null;
      renderCrsInfo();
      message(formMessage, "Formulario limpio.", "");
    });
  }

  const copyBtn = document.querySelector("#copyButton");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
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
  }

  const reuseBtn = document.querySelector("#reuseButton");
  if (reuseBtn) {
    reuseBtn.addEventListener("click", () => {
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
  }

  if (sourceCrs) sourceCrs.addEventListener("change", renderCrsInfo);
  if (targetCrs) targetCrs.addEventListener("change", renderCrsInfo);
window.addEventListener("load", initialize);

// Register a service worker to enable offline usage (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      console.log('Service worker registered.', reg);

      // Immediately check for an update on load (safe if offline)
      try {
        reg.update();
      } catch (err) {
        // update may fail offline; ignore
      }

      // If there's an updated worker already waiting, prompt the user
      if (reg.waiting) {
        promptUserToRefresh(reg);
      }

      // Listen for new installing workers
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            // A new service worker is installed and waiting if there's a controller
            if (navigator.serviceWorker.controller) {
              promptUserToRefresh(reg);
            }
          }
        });
      });

      // Also check when the app regains connectivity
      window.addEventListener('online', () => {
        try { reg.update(); } catch (e) {}
      });

    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });

    // Reload the page when the new service worker activates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

function promptUserToRefresh(registration) {
  // Create a simple banner if it doesn't exist
  if (document.querySelector('.update-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.style.position = 'fixed';
  banner.style.left = '12px';
  banner.style.right = '12px';
  banner.style.bottom = '18px';
  banner.style.zIndex = '9999';
  banner.style.display = 'flex';
  banner.style.gap = '10px';
  banner.style.alignItems = 'center';
  banner.style.justifyContent = 'space-between';
  banner.style.padding = '12px 14px';
  banner.style.borderRadius = '8px';
  banner.style.boxShadow = '0 6px 24px rgba(16,24,40,0.12)';
  banner.style.background = '#fff';

  const text = document.createElement('div');
  text.textContent = 'Hay una nueva versión de la app. Actualiza para ver los cambios.';
  text.style.color = 'var(--ink)';

  const actions = document.createElement('div');

  const updateBtn = document.createElement('button');
  updateBtn.className = 'btn btn-primary';
  updateBtn.textContent = 'Actualizar';
  updateBtn.addEventListener('click', () => {
    // Tell the waiting service worker to skipWaiting
    if (!registration || !registration.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Cerrar';
  closeBtn.addEventListener('click', () => {
    banner.remove();
  });

  actions.appendChild(updateBtn);
  actions.appendChild(closeBtn);
  banner.appendChild(text);
  banner.appendChild(actions);
  document.body.appendChild(banner);

  // Remove banner after 2 minutes to avoid lingering UI
  setTimeout(() => {
    banner.remove();
  }, 120000);
}
