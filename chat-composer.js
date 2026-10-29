document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".cm-chat-compose textarea").forEach(textarea => {
        const resizeToContent = () => {
            textarea.style.height = "48px";
            const maxHeight = 150;
            const height = Math.min(Math.max(textarea.scrollHeight, 48), maxHeight);
            textarea.style.height = `${height}px`;
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
        };

        textarea.addEventListener("input", resizeToContent);
        textarea.form?.addEventListener("submit", () => requestAnimationFrame(resizeToContent), true);
        resizeToContent();
    });
});
