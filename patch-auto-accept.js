const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const EXTENSION_PUBLISHER = 'munkhin';
const EXTENSION_NAME = 'auto-accept-agent';
const TARGET_FILE = 'dist/extension.js'; // The file to patch

function log(msg) {
    console.log(`[Auto Accept Patcher] ${msg}`);
}

function error(msg) {
    console.error(`[Auto Accept Patcher] ERROR: ${msg}`);
    process.exit(1);
}

function findExtensionPath() {
    const vscodeExtensionsDir = path.join(os.homedir(), '.vscode', 'extensions');
    if (!fs.existsSync(vscodeExtensionsDir)) {
        error(`VS Code extensions directory not found at: ${vscodeExtensionsDir}`);
    }

    const extensions = fs.readdirSync(vscodeExtensionsDir);
    // Find directory starting with 'munkhin.auto-accept-agent-'
    // We want the latest version if multiple exist (though VS Code usually keeps one)
    const candidates = extensions.filter(dir => 
        dir.toLowerCase().startsWith(`${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`.toLowerCase())
    ).sort(); // Sort to get latest version last if semantic naming is used

    if (candidates.length === 0) {
        error(`Extension not found. Please install the official Auto Accept Agent extension first.`);
    }

    const latest = candidates[candidates.length - 1];
    log(`Found extension: ${latest}`);
    return path.join(vscodeExtensionsDir, latest);
}

function patchFile(filePath) {
    if (!fs.existsSync(filePath)) {
        error(`Target file not found: ${filePath}`);
    }

    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Check if already patched
    if (originalContent.includes('// PATCHED BY AUTO ACCEPT PATCHER')) {
        log('Extension appears to be already patched.');
        // We continue anyway in case we want to re-patch or logic changed, 
        // but duplicate patches might be messy. Ideally we revert first.
    }

    let patchedContent = originalContent;
    let modified = false;

    // 1. Force isPro() to return true
    // Matches: isPro() { ... } or isPro(){ ... }
    const isProRegex = /(isPro\s*\([^)]*\)\s*\{)/g;
    if (isProRegex.test(patchedContent)) {
        patchedContent = patchedContent.replace(isProRegex, '$1 return true; ');
        log('Patched: isPro() -> true');
        modified = true;
    } else {
        log('Warning: isPro() method not found.');
    }

    // 2. Stub checkProStatus to return true immediately
    // Matches: async checkProStatus(userId) { ... }
    const checkProRegex = /(async\s+checkProStatus\s*\([^)]*\)\s*\{)/g;
    if (checkProRegex.test(patchedContent)) {
        patchedContent = patchedContent.replace(checkProRegex, '$1 return Promise.resolve(true); ');
        log('Patched: checkProStatus() -> true');
        modified = true;
    } else {
        log('Warning: checkProStatus() method not found.');
    }

    // 3. Disable showUpgradePrompt
    // Matches: static showUpgradePrompt(...) { ... }
    const upgradePromptRegex = /(static\s+showUpgradePrompt\s*\([^)]*\)\s*\{)/g;
    if (upgradePromptRegex.test(patchedContent)) {
        patchedContent = patchedContent.replace(upgradePromptRegex, '$1 return; ');
        log('Patched: showUpgradePrompt() -> disabled');
        modified = true;
    } else {
        log('Warning: showUpgradePrompt() method not found.');
    }

    // 4. Force "Upgrade" UI sections to be hidden/modified if possible
    // Search for specific strings in getHtmlContent if needed.
    // Usually isPro() is enough, but some banners might be hardcoded.
    // We can inject a signature to mark it patched.
    patchedContent += '\n// PATCHED BY AUTO ACCEPT PATCHER\n';

    if (modified) {
        // Backup
        const backupPath = filePath + '.bak';
        fs.writeFileSync(backupPath, originalContent);
        log(`Created backup at: ${backupPath}`);

        // Write patched
        fs.writeFileSync(filePath, patchedContent);
        log('Successfully wrote patched extension.js');
        log('Please RESTART VS Code (and Reload Window) for changes to take effect.');
    } else {
        log('No patterns matched. The extension code might have changed significantly.');
    }
}

function main() {
    try {
        log('Starting patch process...');
        
        let extensionPath = process.argv[2];
        
        if (!extensionPath) {
            extensionPath = findExtensionPath();
        } else {
             log(`Using provided path: ${extensionPath}`);
        }

        const targetFilePath = path.join(extensionPath, TARGET_FILE); // extension/dist/extension.js
        // Note: The structure inside the extension folder usually matches what's in the VSIX
        // In our main repo, it is extension/dist/extension.js. 
        // INSTALLED EXTENSION structure:
        // ~/.vscode/extensions/munkhin.../
        //   package.json
        //   dist/
        //     extension.js
        // NOTE: The 'extension/' folder layer from source usually disappears in installation root, 
        // OR everything is in root.
        // Let's verify structure. The VSIX usually puts contents of 'extension/' folder into root of install dir if packaged that way.
        // Wait, 'vsce package' packages the files listed in package.json or everything.
        // If my repo has `extension/package.json`, then `extension` is the root of the vsix content.
        // So `dist/extension.js` should be at `${installDir}/dist/extension.js`.
        
        patchFile(targetFilePath);

    } catch (e) {
        error(`Unexpected error: ${e.message}`);
    }
}

main();
