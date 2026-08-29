// QuranChain prayer and Quran-reading tracker — isolated internal-test preview.
//
// This module deliberately has no server-side writes, account system, location
// access, payment integration, or blockchain functionality. User-entered
// progress is stored only in the browser's localStorage.

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cache-Control": "no-store",
  "X-DarCloud-No-SSO": "1",
};

function response(request, body, status, contentType, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": contentType,
      ...extraHeaders,
    },
  });
}

function json(request, data, status = 200, extraHeaders = {}) {
  return response(
    request,
    JSON.stringify(data),
    status,
    "application/json;charset=UTF-8",
    extraHeaders,
  );
}

const APP = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>QuranChain Tracker Internal Test</title>
  <meta name="description" content="A device-only prayer and Quran-reading tracker for internal product testing.">
  <style>
    :root{color-scheme:dark;--bg:#07110d;--panel:#10221a;--panel2:#142b21;--line:#315744;--text:#f4f4e9;--muted:#b4c5ba;--green:#77d5a4;--gold:#efc86d;--danger:#ff9c91}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#183c2b 0,var(--bg) 42%);color:var(--text);font:16px/1.5 system-ui,-apple-system,sans-serif}
    main{width:min(960px,calc(100% - 2rem));margin:0 auto;padding:2.5rem 0 4rem}.eyebrow{display:inline-block;border:1px solid #866c31;background:#2b2412;color:#ffe3a0;border-radius:999px;padding:.35rem .75rem;font-size:.76rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    h1{font-size:clamp(2.2rem,7vw,4.4rem);line-height:1.04;margin:.8rem 0 .5rem}h1 span{color:var(--gold)}p{color:var(--muted)}.notice{border-left:4px solid var(--gold);background:#201d13;border-radius:10px;padding:1rem 1.2rem;margin:1.3rem 0 1.7rem}.notice strong{color:var(--gold)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}.card{background:rgba(16,34,26,.96);border:1px solid var(--line);border-radius:18px;padding:1.2rem}.card h2{font-size:1.15rem;margin:0 0 .3rem}.card>p{font-size:.9rem;margin:.2rem 0 1rem}
    .prayer{display:flex;align-items:center;gap:.75rem;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:.72rem;margin:.55rem 0}.prayer input{width:1.2rem;height:1.2rem;accent-color:var(--green)}label{font-weight:700}.field{margin:.85rem 0}.field label{display:block;font-size:.84rem;color:var(--muted);margin-bottom:.3rem}.field input{width:100%;background:#091811;border:1px solid var(--line);border-radius:9px;color:var(--text);font:inherit;padding:.65rem .75rem}.field input:focus{outline:2px solid var(--green);outline-offset:1px}
    button{border:1px solid var(--green);background:#193c2b;color:var(--text);border-radius:9px;padding:.63rem .85rem;font:inherit;font-weight:750;cursor:pointer}button:hover{background:#22523a}button.secondary{border-color:var(--line);background:transparent}button.danger{border-color:#884b45;background:#351b19;color:var(--danger)}.actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}.timer{font-size:2.4rem;font-variant-numeric:tabular-nums;color:var(--gold);font-weight:800;margin:.7rem 0}
    #status{min-height:1.5rem;color:var(--green);font-size:.9rem}.privacy{margin-top:1.2rem;font-size:.88rem}.privacy strong{color:var(--text)}a{color:var(--green)}footer{margin-top:2rem;border-top:1px solid var(--line);padding-top:1.2rem;color:var(--muted);font-size:.84rem}
  </style>
  <script src="/app.js" defer></script>
</head>
<body>
  <main>
    <span class="eyebrow">Internal test · device-only data</span>
    <h1>Prayer &amp; Quran <span>Tracker</span></h1>
    <p>A simple personal checklist for recording worship you have already completed.</p>
    <div class="notice"><strong>Manual records only.</strong><p>This preview does not calculate prayer times, verify religious obligations, access your position, or send entries to a server.</p></div>

    <div class="grid">
      <section class="card" aria-labelledby="prayer-heading">
        <h2 id="prayer-heading">Today's prayers</h2>
        <p id="today-label">Mark completed prayers for this device's current date.</p>
        <label class="prayer"><input type="checkbox" data-prayer="fajr"> Fajr</label>
        <label class="prayer"><input type="checkbox" data-prayer="dhuhr"> Dhuhr</label>
        <label class="prayer"><input type="checkbox" data-prayer="asr"> Asr</label>
        <label class="prayer"><input type="checkbox" data-prayer="maghrib"> Maghrib</label>
        <label class="prayer"><input type="checkbox" data-prayer="isha"> Isha</label>
      </section>

      <section class="card" aria-labelledby="reading-heading">
        <h2 id="reading-heading">Reading progress</h2>
        <p>Enter your own progress. No Quran text or interpretation is supplied by this preview.</p>
        <div class="field"><label for="page">Current Mushaf page (1–604)</label><input id="page" inputmode="numeric" type="number" min="1" max="604" step="1"></div>
        <div class="field"><label for="pages-today">Pages read today (0–604)</label><input id="pages-today" inputmode="numeric" type="number" min="0" max="604" step="1"></div>
        <div class="field"><label for="minutes-today">Reading minutes today (0–1440)</label><input id="minutes-today" inputmode="numeric" type="number" min="0" max="1440" step="1"></div>
        <button id="save-reading" type="button">Save on this device</button>
      </section>

      <section class="card" aria-labelledby="timer-heading">
        <h2 id="timer-heading">Recitation session timer</h2>
        <p>A local stopwatch. Closing the page stops the active session.</p>
        <div id="timer" class="timer" aria-live="off">00:00:00</div>
        <div class="actions">
          <button id="timer-toggle" type="button">Start</button>
          <button id="timer-reset" class="secondary" type="button">Reset timer</button>
        </div>
      </section>

      <section class="card" aria-labelledby="data-heading">
        <h2 id="data-heading">Your preview data</h2>
        <p>Entries remain in this browser profile. Clearing site storage or using the button below removes them.</p>
        <div class="actions"><button id="erase" class="danger" type="button">Erase local tracker data</button></div>
        <p id="status" role="status" aria-live="polite"></p>
      </section>
    </div>

    <p class="privacy"><strong>Privacy summary:</strong> no account, analytics, advertising, payments, position access, or server sync are present in this internal preview.</p>
    <footer><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/delete-data">Delete data help</a><br>QuranChain Tracker internal test. Not religious advice.</footer>
  </main>
</body>
</html>`;

const APP_JS = `"use strict";
(() => {
  const KEY = "darcloud.quranTracker.preview.v1";
  const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const isoDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  };
  const today = isoDate();
  const empty = () => ({ version: 1, prayers: {}, reading: {} });
  const load = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
      return parsed && parsed.version === 1 && parsed.prayers && parsed.reading ? parsed : empty();
    } catch (_) { return empty(); }
  };
  const state = load();
  const persist = (message) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      status.textContent = message;
    } catch (_) { status.textContent = "This browser did not save the entry."; }
  };
  const status = document.getElementById("status");
  document.getElementById("today-label").textContent = "Mark completed prayers for " + today + ".";
  const todayPrayers = state.prayers[today] || {};
  document.querySelectorAll("[data-prayer]").forEach((box) => {
    const name = box.dataset.prayer;
    box.checked = todayPrayers[name] === true;
    box.addEventListener("change", () => {
      state.prayers[today] = state.prayers[today] || {};
      state.prayers[today][name] = box.checked;
      persist("Prayer checklist saved on this device.");
    });
  });

  const reading = state.reading[today] || {};
  const page = document.getElementById("page");
  const pagesToday = document.getElementById("pages-today");
  const minutesToday = document.getElementById("minutes-today");
  if (Number.isInteger(reading.page)) page.value = String(reading.page);
  if (Number.isInteger(reading.pagesToday)) pagesToday.value = String(reading.pagesToday);
  if (Number.isInteger(reading.minutesToday)) minutesToday.value = String(reading.minutesToday);
  const validInteger = (input, min, max) => {
    const value = Number(input.value);
    return Number.isInteger(value) && value >= min && value <= max ? value : null;
  };
  document.getElementById("save-reading").addEventListener("click", () => {
    const values = {
      page: validInteger(page, 1, 604),
      pagesToday: validInteger(pagesToday, 0, 604),
      minutesToday: validInteger(minutesToday, 0, 1440),
    };
    if (Object.values(values).some((value) => value === null)) {
      status.textContent = "Enter whole numbers within the ranges shown.";
      return;
    }
    state.reading[today] = values;
    persist("Reading progress saved on this device.");
  });

  let elapsed = 0;
  let interval = null;
  const timer = document.getElementById("timer");
  const toggle = document.getElementById("timer-toggle");
  const renderTimer = () => {
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    timer.textContent = hours + ":" + minutes + ":" + seconds;
  };
  toggle.addEventListener("click", () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
      toggle.textContent = "Resume";
      return;
    }
    interval = setInterval(() => { elapsed += 1; renderTimer(); }, 1000);
    toggle.textContent = "Pause";
  });
  document.getElementById("timer-reset").addEventListener("click", () => {
    if (interval) clearInterval(interval);
    interval = null;
    elapsed = 0;
    toggle.textContent = "Start";
    renderTimer();
  });
  document.getElementById("erase").addEventListener("click", () => {
    if (!window.confirm("Erase all prayer and reading entries saved by this preview on this device?")) return;
    localStorage.removeItem(KEY);
    window.location.reload();
  });
})();`;

const PRIVACY = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tracker Privacy</title></head><body><main><h1>QuranChain Tracker privacy</h1><p>Internal-test version, updated August 29, 2026.</p><p>The tracker has no account, advertising, analytics, payment, position, camera, microphone, or server-sync feature. Prayer and reading entries are stored only in this browser profile using localStorage.</p><p>The web host may process ordinary connection data needed to deliver the page, such as an IP address and request metadata. The tracker code does not add analytics or advertising identifiers.</p><p>Use <a href="/delete-data">Delete data help</a> to remove locally stored entries.</p><p><a href="/">Return to tracker</a></p></main></body></html>`;

const TERMS = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tracker Terms</title></head><body><main><h1>QuranChain Tracker internal-test terms</h1><p>This preview is an optional personal recordkeeping tool. It does not calculate prayer times, determine religious obligations, provide religious rulings, or replace guidance from a qualified scholar.</p><p>Records are user-entered and may be lost if browser storage is cleared. The preview is provided for internal evaluation without a service-availability promise.</p><p><a href="/">Return to tracker</a></p></main></body></html>`;

const DELETE_DATA = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delete Tracker Data</title></head><body><main><h1>Delete local tracker data</h1><p>Open the tracker and select “Erase local tracker data.” You can also clear site data for this domain in your browser or Android system settings.</p><p>There is no tracker account or server-side prayer and reading record to delete in this internal-test version.</p><p><a href="/">Open tracker</a></p></main></body></html>`;

const src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const allow = { Allow: "GET, HEAD, OPTIONS" };

    if (request.method === "OPTIONS") {
      return response(request, null, 204, "text/plain;charset=UTF-8", allow);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json(request, { error: "Writes are disabled in this internal-test preview." }, 405, allow);
    }
    if (url.pathname === "/health") {
      return json(request, {
        status: "ok",
        service: "QuranChain Tracker preview",
        mode: "internal-test",
        server_writes_enabled: false,
        accounts_enabled: false,
        payments_enabled: false,
        location_access_enabled: false,
        user_entries: "device-only",
      });
    }
    if (url.pathname === "/app.js") {
      return response(request, APP_JS, 200, "text/javascript;charset=UTF-8");
    }
    if (url.pathname === "/privacy") {
      return response(request, PRIVACY, 200, "text/html;charset=UTF-8");
    }
    if (url.pathname === "/terms") {
      return response(request, TERMS, 200, "text/html;charset=UTF-8");
    }
    if (url.pathname === "/delete-data") {
      return response(request, DELETE_DATA, 200, "text/html;charset=UTF-8");
    }
    if (url.pathname !== "/") {
      return json(request, { error: "Not found", mode: "internal-test" }, 404);
    }
    return response(request, APP, 200, "text/html;charset=UTF-8");
  },
};

export { src_default as default };
