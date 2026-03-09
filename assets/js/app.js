document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load header and footer and inject into DOM
        const [headerRes, footerRes] = await Promise.all([
            fetch('assets/header.html'),
            fetch('assets/footer.html')
        ]);

        if (headerRes.ok) {
            const headerHtml = await headerRes.text();
            document.body.insertAdjacentHTML('afterbegin', headerHtml);
        }

        if (footerRes.ok) {
            const footerHtml = await footerRes.text();
            document.body.insertAdjacentHTML('beforeend', footerHtml);
        }

        // Add class to hide legacy headers
        document.body.classList.add('has-app-shell');

        // small nav interactions (mobile)
        // future: add menu toggle
    } catch (err) {
        console.warn('Failed to load app shell', err);
    }
});
