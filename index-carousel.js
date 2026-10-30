document.addEventListener("DOMContentLoaded", () => {
    const viewport = document.getElementById("landingViewport");
    const track = document.getElementById("landingTrack");
    if (!viewport || !track) return;

    const slides = [...track.querySelectorAll(".landing-slide")];
    const dots = [...document.querySelectorAll("[data-carousel-dot]")];
    const previous = document.querySelector("[data-carousel-prev]");
    const next = document.querySelector("[data-carousel-next]");
    const counter = document.getElementById("landingCurrentSlide");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeIndex = 0;
    let scrollFrame = 0;

    const goTo = index => {
        activeIndex = Math.max(0, Math.min(slides.length - 1, index));
        viewport.scrollTo({ left: activeIndex * viewport.clientWidth, behavior: reducedMotion.matches ? "auto" : "smooth" });
        updateControls();
    };

    const updateControls = () => {
        const measuredIndex = Math.round(viewport.scrollLeft / Math.max(viewport.clientWidth, 1));
        activeIndex = Math.max(0, Math.min(slides.length - 1, measuredIndex));
        dots.forEach((dot, index) => {
            const selected = index === activeIndex;
            dot.classList.toggle("active", selected);
            if (selected) dot.setAttribute("aria-current", "step");
            else dot.removeAttribute("aria-current");
            dot.tabIndex = selected ? 0 : -1;
        });
        if (counter) counter.textContent = String(activeIndex + 1).padStart(2, "0");
        if (previous) previous.disabled = activeIndex === 0;
        if (next) next.disabled = activeIndex === slides.length - 1;
    };

    previous?.addEventListener("click", () => goTo(activeIndex - 1));
    next?.addEventListener("click", () => goTo(activeIndex + 1));
    dots.forEach(dot => dot.addEventListener("click", () => goTo(Number(dot.dataset.carouselDot))));
    document.querySelectorAll("[data-go-slide]").forEach(button => {
        button.addEventListener("click", () => goTo(Number(button.dataset.goSlide)));
    });

    viewport.addEventListener("scroll", () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(updateControls);
    }, { passive: true });
    viewport.addEventListener("keydown", event => {
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
    });
    document.querySelectorAll('.public-nav a[href="#como-funciona"], .public-nav a[href="#apresentacao"]').forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            const targetId = link.getAttribute("href").slice(1);
            goTo(targetId === "apresentacao" ? 0 : slides.findIndex(slide => slide.id === targetId));
        });
    });

    window.addEventListener("resize", () => {
        viewport.scrollLeft = activeIndex * viewport.clientWidth;
        updateControls();
    });
    updateControls();
});
