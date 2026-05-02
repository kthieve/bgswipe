import {
  getContext,
  eventSource,
  event_types,
  generateQuietPrompt,
  renderMessage
} from "../../../../script.js";

let generationInProgress = false;

/**
 * Get current visible swipe
 */
function getActiveSwipeIndex(messageIndex) {
  const context = getContext();
  return context.chat[messageIndex]?.swipe_id ?? 0;
}

/**
 * Restore swipe UI
 */
function restoreSwipe(messageIndex, swipeIndex) {
  const context = getContext();
  const mes = context.chat[messageIndex];
  if (!mes) return;

  mes.swipe_id = swipeIndex;
  renderMessage(messageIndex);

  document
    .querySelector(`.mes[data-mesid="${messageIndex}"]`)
    ?.classList.remove("swipe-loading");
}

/**
 * Generate swipe silently
 */
async function generateBackgroundSwipe(messageIndex) {
  if (generationInProgress) return;
  generationInProgress = true;

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
  generationInProgress = false;
}

/**
 * Add UI button
 */
function injectButton() {
  const controls = document.querySelector("#chat_controls");
  if (!controls || document.querySelector("#bg-swipe-btn")) return;

  const btn = document.createElement("button");
  btn.id = "bg-swipe-btn";
  btn.className = "menu_button";
  btn.textContent = "BG Swipe";

  btn.onclick = async () => {
    const context = getContext();
    if (!context.chat.length) return;
    const idx = context.chat.length - 1;
    await generateBackgroundSwipe(idx);
  };

  controls.appendChild(btn);
}

/**
 * Wait for UI
 */
const uiWaiter = setInterval(() => {
  if (document.querySelector("#chat_controls")) {
    clearInterval(uiWaiter);
    injectButton();
  }
}, 300);
