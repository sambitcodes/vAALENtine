/**
 * ANALYTICS MODULE
 * Tracks user activity, device info, location, and clicks.
 */
const Analytics = {
    sessionStartTime: null,
    clickLog: [],
    deviceInfo: {},
    location: null,
    syncInterval: null,
    storageKey: 'vAALENtine_clickLog',

    init: function () {
        this.sessionStartTime = new Date().toISOString();
        this.getDeviceInfo();
        this.getLocation();

        // Load existing logs from this session (persists across pages)
        this.loadLogs();

        this.startClickListener();
        console.log("Analytics Initialized. Current log count:", this.clickLog.length);
    },

    loadLogs: function () {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.clickLog = JSON.parse(stored);
            }
        } catch (e) {
            console.warn("Analytics: Failed to load logs", e);
            this.clickLog = [];
        }
    },

    saveLogs: function () {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.clickLog));
        } catch (e) {
            console.warn("Analytics: Failed to save logs", e);
        }
    },

    clearData: function () {
        this.clickLog = [];
        localStorage.removeItem(this.storageKey);
        console.log("Analytics: Data cleared.");
    },

    getDeviceInfo: function () {
        this.deviceInfo = {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            platform: navigator.platform,
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        };
    },

    getLocation: function () {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                },
                (error) => {
                    console.warn("Analytics: Location access denied or error", error);
                    this.location = { error: "Permission denied or unavailable" };
                }
            );
        } else {
            this.location = { error: "Geolocation not supported" };
        }
    },

    startClickListener: function () {
        document.addEventListener('click', (e) => {
            // Try to identify the element
            let target = e.target;

            // Helpful if user clicks an icon inside a button
            const closestInteractive = target.closest('button, a, .clickable, .game-card');
            if (closestInteractive) target = closestInteractive;

            let label = target.innerText || target.getAttribute('aria-label') || target.id || target.className || target.tagName;

            // Clean up label (truncate if too long)
            if (typeof label === 'string') {
                label = label.trim().substring(0, 50);
            } else {
                label = "Unknown Element";
            }

            const clickEvent = {
                timestamp: new Date().toISOString(),
                x: e.clientX,
                y: e.clientY,
                element: target.tagName,
                id: target.id || '',
                class: typeof target.className === 'string' ? target.className : '',
                label: label,
                page: window.location.pathname
            };

            this.clickLog.push(clickEvent);
            this.saveLogs(); // Immediate persistence
        }, true); // Capture phase
    },

    getData: function () {
        return {
            startTime: this.sessionStartTime,
            endTime: new Date().toISOString(),
            deviceInfo: this.deviceInfo,
            location: this.location,
            clicks: this.clickLog,
            page: window.location.pathname
        };
    },

    async sendReport() {
        const userPhone = localStorage.getItem('vAALENtine_user');
        if (!userPhone) return;

        const data = this.getData();

        try {
            console.log("Analytics: Sending report...");
            const response = await fetch('/api/analytics/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: userPhone,
                    sessionData: data
                })
            });

            if (response.ok) {
                console.log("Analytics: Report sent successfully.");
                this.clearData(); // Clear logs ONLY on success
            } else {
                console.error("Analytics: Server rejected report.");
            }
        } catch (err) {
            console.error("Analytics: Failed to send report", err);
        }
    }
};

// Auto-init if user is logged in
if (localStorage.getItem('vAALENtine_session') === 'authenticated') {
    Analytics.init();
}
