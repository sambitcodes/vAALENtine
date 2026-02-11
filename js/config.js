// Modified to fetch from backend
let CONFIG = {};

const loadConfig = async () => {
    try {
        const response = await fetch('/api/config');
        CONFIG = await response.json();
        console.log('Config loaded from server:', CONFIG);
        return CONFIG;
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback or handle error
    }
};

// Initial load
loadConfig();

// Note: Components using CONFIG should ideally wait for the promise or handle initial undefined state.
// In this project, DOMContentLoaded in page-specific scripts will be updated to handle this.

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
