# Auto Accept Patcher

This repository contains a patcher script to unlock "Pro" features in the **Auto Accept Agent** extension for VS Code / Antigravity / Cursor.

## How it works

The `patch-auto-accept.js` script works by locally modifying your **installed** extension to:
- Force "Pro" status (always true).
- Remove license verification checks.
- Unlock UI settings (poll frequency, banned commands).
- Remove upgrade prompts.

This allows you to use the official extension without restrictions, purely by modifying your own local copy.

## Usage

1.  **Install the official extension**: Search for "Auto Accept Agent" (published by MunKhin) in the Extensions view and install it.
2.  **Run the patcher**:
    ```bash
    node patch-auto-accept.js
    ```
    The script will automatically locate the extension in your `~/.vscode/extensions` folder and apply the patch.
3.  **Restart VS Code**: Reload the window or restart the IDE for changes to take effect.

## Features Unlocked

- ✅ Background Mode (Multi-tab automation)
- ✅ Custom Poll Frequency (Performance mode)
- ✅ Custom Safety Rules (Banned commands)
- ✅ No Interruption Prompts

## Disclaimer

This patcher is for educational purposes and personal use.
This patcher script itself is provided under the MIT License.