# Background Swipe Generator (SillyTavern Extension)

An extension for **SillyTavern** that allows users to generate assistant swipes in the background without interrupting their reading flow.

## Project Overview

*   **Purpose:** Adds a "BG Swipe" button to the chat controls. When clicked, it triggers a "quiet" generation of a new swipe for the last message. It then restores the user's current swipe so they can keep reading while the new one is prepared.
*   **Technologies:** JavaScript (SillyTavern Extension API), CSS.
*   **Architecture:**
    *   `manifest.json`: SillyTavern extension metadata (name, author, entry point, style).
    *   `index.js`: Main logic. Interacts with SillyTavern's `script.js` exports. Handles UI injection and generation orchestration.
    *   `style.css`: Styles for the custom button and settings panel.

## Key Features

*   **Background Generation:** Uses `generateQuietPrompt` to create swipes without blocking the UI.
*   **Queueing:** Allows multiple swipes to be queued (configurable via settings).
*   **Auto-Generation:** Option to automatically start the next background swipe once one finishes.
*   **Notifications:** Uses SillyTavern's `toastr` for status updates when a new swipe is ready.
*   **Settings Panel:** Integrated into SillyTavern's extension settings (Extensions -> Background Swipe Generator).

## Development Conventions

*   **SillyTavern Integration:** Imports core functionality from `../../../../script.js`.
*   **Event Driven:** Uses `eventSource` to listen for `CHAT_CHANGED`, `MESSAGE_RENDERED`, and `GENERATION_STOPPED`.
*   **UI Injection:** Targets `#chat_controls` and `#extensions_settings` for DOM manipulation.
*   **Settings Persistence:** Uses `loadSettings` and `saveSettingsDebounced` for persistent configuration.
