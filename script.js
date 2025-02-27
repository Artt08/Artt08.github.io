
document.addEventListener("DOMContentLoaded", () => {
    // Portfolio items hover effect enhancement
    const projectItems = document.querySelectorAll(".project-item");
    
    projectItems.forEach(item => {
        item.addEventListener("mouseenter", function() {
            this.querySelector(".project-overlay").style.transform = "translateY(0)";
        });
        
        item.addEventListener("mouseleave", function() {
            this.querySelector(".project-overlay").style.transform = "translateY(100%)";
        });
    });
    
    const faqTitles = document.querySelectorAll(".faq-title");
    
    faqTitles.forEach(title => {
        title.addEventListener("click", function() {
            const content = this.nextElementSibling;
            const isOpen = content.style.maxHeight;
            
            // Close all open FAQs and reset the '+' sign
            document.querySelectorAll(".faq-content").forEach(item => {
                item.style.maxHeight = null;
            });
            
            document.querySelectorAll(".faq-title").forEach(item => {
                item.style.borderRadius = "5px";
                item.style.backgroundColor = "rgb(139, 29, 116)";
                item.style.setProperty("--after-content", "'+'");
            });
            
            // Open the clicked FAQ if it wasn't already open
            if (!isOpen) {
                content.style.maxHeight = content.scrollHeight + "px";
                this.style.borderRadius = "5px 5px 0 0";
                this.style.backgroundColor = "rgb(110, 20, 95)";
                this.style.setProperty("--after-content", "'-'");
            }
        });
    });
    
    // Check if there's a hash in the URL and open the corresponding FAQ
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const targetFaq = document.getElementById(id);
        if (targetFaq) {
            targetFaq.scrollIntoView();
            const faqTitle = targetFaq.querySelector('.faq-title');
            if (faqTitle) {
                faqTitle.click();
            }
        }
    }
    
    // Handle window resize to adjust the max-height of open FAQs
    window.addEventListener('resize', () => {
        const openFaq = document.querySelector('.faq-content[style*="max-height"]');
        if (openFaq) {
            openFaq.style.maxHeight = openFaq.scrollHeight + "px";
        }
    });
});
