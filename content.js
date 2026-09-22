(function () {
    "use strict";

    const BUTTON_ID = "roblox-asset-image-downloader-button";
    const CLASS_PREFIX = "web-blox-css-tss-";

    function findAssetImage() {
        const images = document.querySelectorAll("img");

        for (const img of images) {
            const classes = Array.from(img.classList);

            const hasTargetClass = classes.some(className =>
                className.includes(CLASS_PREFIX)
            );

            if (hasTargetClass && img.src) {
                return img;
            }
        }

        return null;
    }

    function getAssetId() {
        const match = window.location.pathname.match(
            /\/store\/asset\/(\d+)/
        );

        return match ? match[1] : "roblox_asset";
    }

    function createButton() {
        if (document.getElementById(BUTTON_ID)) {
            return;
        }

        const button = document.createElement("button");

        button.id = BUTTON_ID;
        button.textContent = "Download Asset Image";

        button.style.position = "fixed";
        button.style.right = "20px";
        button.style.bottom = "20px";
        button.style.zIndex = "999999";

        button.style.padding = "10px 16px";
        button.style.border = "none";
        button.style.borderRadius = "8px";

        button.style.background = "#111111";
        button.style.color = "#ffffff";

        button.style.fontSize = "14px";
        button.style.fontFamily = "Arial, sans-serif";
        button.style.fontWeight = "600";

        button.style.cursor = "pointer";
        button.style.boxShadow = "0 3px 12px rgba(0, 0, 0, 0.35)";

        button.addEventListener("mouseenter", () => {
            button.style.background = "#292929";
        });

        button.addEventListener("mouseleave", () => {
            button.style.background = "#111111";
        });

        button.addEventListener("click", downloadAssetImage);

        document.body.appendChild(button);
    }

    async function downloadAssetImage() {
        const button = document.getElementById(BUTTON_ID);

        const image = findAssetImage();

        if (!image) {
            alert(
                "Could not find an image with a class containing " +
                CLASS_PREFIX
            );
            return;
        }

        const imageURL = image.src;

        if (!imageURL) {
            alert("The image does not have a src URL.");
            return;
        }

        button.disabled = true;
        button.textContent = "Downloading...";

        try {
            const assetId = getAssetId();

            /*
             * Use the original image URL directly.
             * Chrome's download API will save the WebP returned by Roblox.
             */
            const response = await fetch(imageURL, {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(
                    "HTTP " + response.status
                );
            }

            const blob = await response.blob();

            const blobURL = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobURL;
            a.download = `${assetId}.webp`;

            document.body.appendChild(a);
            a.click();
            a.remove();

            setTimeout(() => {
                URL.revokeObjectURL(blobURL);
            }, 1000);

            button.textContent = "Downloaded!";

            setTimeout(() => {
                button.textContent = "Download Asset Image";
            }, 1500);

        } catch (error) {
            console.error(
                "Roblox Asset Image Downloader:",
                error
            );

            /*
             * If fetch is blocked for some reason, try Chrome's
             * normal download behavior as a fallback.
             */
            try {
                const assetId = getAssetId();

                chrome.runtime.sendMessage({
                    action: "download",
                    url: imageURL,
                    filename: `${assetId}.webp`
                });

                button.textContent = "Download Started!";

                setTimeout(() => {
                    button.textContent = "Download Asset Image";
                }, 1500);

            } catch (fallbackError) {
                console.error(fallbackError);

                alert(
                    "Failed to download the asset image.\n\n" +
                    "Image URL:\n" +
                    imageURL
                );

                button.textContent = "Download Asset Image";
            }
        }

        button.disabled = false;
    }

    function initialize() {
        createButton();
    }

    /*
     * Roblox uses a dynamic React page, so wait for the page
     * and also watch for navigation/content changes.
     */
    initialize();

    const observer = new MutationObserver(() => {
        if (!document.getElementById(BUTTON_ID)) {
            createButton();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    /*
     * Handle Roblox's client-side navigation.
     */
    let lastURL = location.href;

    setInterval(() => {
        if (location.href !== lastURL) {
            lastURL = location.href;

            if (
                location.pathname.startsWith("/store/asset/")
            ) {
                setTimeout(createButton, 500);
            }
        }
    }, 500);
})();