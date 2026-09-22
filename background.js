chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== "download") {
        return;
    }

    chrome.downloads.download({
        url: message.url,
        filename: message.filename || "roblox_asset.webp",
        saveAs: false
    });
});