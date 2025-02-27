
document.addEventListener("DOMContentLoaded", () => {
    const faqTitles = document.querySelectorAll(".faq-title");
    
    faqTitles.forEach(title => {
        title.addEventListener("click", function() {
            const content = this.nextElementSibling;
            const isOpen = content.style.maxHeight;
            
            // Close all open FAQs
            document.querySelectorAll(".faq-content").forEach(item => {
                item.style.maxHeight = null;
            });
            
            // Open the clicked FAQ if it wasn't already open
            if (!isOpen) {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
});
