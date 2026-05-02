import {
  getContext,
  eventSource,
  event_types,
  generateQuietPrompt,
  renderMessage,
  loadSettings,
  saveSettingsDebounced
} from "../../../../script.js";

/* ---------------- CONFIG ---------------- */

const EXT_ID = "background-swipe-generator";
const BUTTON_ID = "bg-swipe-btn";

const DEFAULT_SETTINGS = {
  enabled: true,
  autoGenerate: false,
  maxQueue: 2,
  notify: true
};

let settings = loadSettings(EXT_ID, DEFAULT_SETTINGS);

/* ---------------- STATE ---------------- */

let generationInProgress = false;
let queued = 0;

/* ---------------- HELPERS ---------------- */

function getActiveSwipeIndex(messageIndex) {
  const ctx = getContext();
  return ctx.chat[messageIndex]?.swipe_id ?? 0;
}

function restoreSwipe(messageIndex, swipeIndex) {
  const ctx = getContext();
  const mes = ctx.chat[messageIndex];
  if (!mes) return;

  mes.swipe_id = swipeIndex;
  renderMessage(messageIndex);

  document
    .querySelector(`.mes[data-mesid="${messageIndex}"]`)
    ?.classList.remove("swipe-loading");
}

function notify(text) {
  if (!settings.notify || typeof toastr === "undefined") return;
  toastr.info(text, "Background Swipe");
}

/* ---------------- CORE ---------------- */

async function generateBackgroundSwipe(messageIndex) {
  if (!settings.enabled) return;
  if (generationInProgress) return;
  if (queued >= settings.maxQueue) return;

  generationInProgress = true;
  queued++;

  const previousSwipe = getActiveSwipeIndex(messageIndex);

  await new Promise((resolve) => {
    const stop = () => {
      eventSource.removeEventListener(
        event_types.GENERATION_STOPPED,
        stop
      );
      resolve();
    };

    eventSource.addEventListener(
      event_types.GENERATION_STOPPED,
      stop
    );

    generateQuietPrompt({
      messageIndex,
      isSwipe: true
    });
  });

  restoreSwipe(messageIndex, previousSwipe);

  queued--;
  generationInProgress = false;

  notify("New swipe ready");

  if (settings.autoGenerate && queued < settings.maxQueue) {
    generateBackgroundSwipe(messageIndex);
  }
}

/* ---------------- BUTTON ---------------- */

function injectButton() {
  const controls = document.querySelector("#chat_controls");
  if (!controls) return;
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.className = "menu_button";
  btn.title = "Generate next swipe without interrupting reading";
  btn.textContent = "BG Swipe";

  btn.onclick = () => {
    const ctx = getContext();
    if (!ctx.chat.length) return;
    generateBackgroundSwipe(ctx.chat.length - 1);
  };

  controls.appendChild(btn);
}

/* ---------------- SETTINGS PANEL ---------------- */

function injectSettingsPanel() {
  const container = document.querySelector("#extensions_settings");
  if (!container) return;
  if (document.getElementById("bg-swipe-settings")) return;

  const panel = document.createElement("div");
  panel.id = "bg-swipe-settings";
  panel.innerHTML = `
    <h3>Background Swipe Generator</h3>

    <label>
      <input type="checkbox" id="bg-enabled">
      Enable background swipe generation
    </label>

    <label>
      <input type="checkbox" id="bg-auto">
      Auto-generate next swipe
    </label>

    <label>
      Maximum queued background swipes
      <input type="number" id="bg-max" min="1" max="10">
    </label>

    <label>
      <input type="checkbox" id="bg-notify">
      Show notification when swipe is ready
    </label>
  `;

  container.appendChild(panel);

  document.getElementById("bg-enabled").checked = settings.enabled;
  document.getElementById("bg-auto").checked = settings.autoGenerate;
  document.getElementById("bg-max").value = settings.maxQueue;
  document.getElementById("bg-notify").checked = settings.notify;

  document.getElementById("bg-enabled").onchange = (e) => {
    settings.enabled = e.target.checked;
    saveSettingsDebounced(EXT_ID, settings);
  };

  document.getElementById("bg-auto").onchange = (e) => {
    settings.autoGenerate = e.target.checked;
    saveSettingsDebounced(EXT_ID, settings);
  };

  document.getElementById("bg-max").onchange = (e) => {
    settings.maxQueue = Number(e.target.value);
    saveSettingsDebounced(EXT_ID, settings);
  };

  document.getElementById("bg-notify").onchange = (e) => {
    settings.notify = e.target.checked;
    saveSettingsDebounced(EXT_ID, settings);
  };
}

/* ---------------- INIT ---------------- */

eventSource.addEventListener(event_types.CHAT_CHANGED, injectButton);
eventSource.addEventListener(event_types.MESSAGE_RENDERED, injectButton);
eventSource.addEventListener(event_types.CHAT_CHANGED, injectSettingsPanel);

const boot = setInterval(() => {
  if (
    document.querySelector("#chat_controls") &&
    document.querySelector("#extensions_settings")
  ) {
    injectButton();
    injectSettingsPanel();
    clearInterval(boot);
  }
}, 300);
