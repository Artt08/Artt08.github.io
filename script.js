document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".faq-title").forEach(title => {
        title.addEventListener("click", function() {
            const content = this.nextElementSibling;
            const isOpen = content.style.maxHeight;

            document.querySelectorAll(".faq-content").forEach(item => item.style.maxHeight = null);

            content.style.maxHeight = isOpen ? null : content.scrollHeight + "px";
        });
    });
});