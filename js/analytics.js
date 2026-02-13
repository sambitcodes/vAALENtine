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

    init: function () {
        this.sessionStartTime = new Date().toISOString();
        this.getDeviceInfo();
        this.getLocation();
        this.startClickListener();
        this.startSync();
        console.log("Analytics Initialized");
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
            let label = target.innerText || target.id || target.className || target.tagName;

            // Clean up label (truncate if too long)
            if (label.length > 50) label = label.substring(0, 50) + "...";

            const clickEvent = {
                timestamp: new Date().toISOString(),
                x: e.clientX,
                y: e.clientY,
                element: target.tagName,
                id: target.id || '',
                class: target.className || '',
                label: label.trim(),
                page: window.location.pathname
            };

            this.clickLog.push(clickEvent);
        }, true); // Capture phase
    },

    startSync: function () {
        // Auto-sync every 30 seconds to server (optional, but good for safety)
        // For now, we mainly rely on the Logout sync to send everything.
        this.syncInterval = setInterval(() => {
            if (this.clickLog.length > 0) {
                // Should implement partial sync if needed, but for simplicity
                // we'll keep everything in memory until logout for now
                // or send "heartbeats".
            }
        }, 30000);
    },

    getData: function () {
        return {
            startTime: this.sessionStartTime,
            endTime: new Date().toISOString(),
            deviceInfo: this.deviceInfo,
            location: this.location,
            clicks: this.clickLog,
            // Game stats are fetched from backend DB separately, but we can send current session stats if tracked here
            page: window.location.pathname
        };
    },

    async sendReport() {
        const userPhone = localStorage.getItem('vAALENtine_user');
        if (!userPhone) return;

        const data = this.getData();

        try {
            console.log("Analytics: Sending report...");
            await fetch('/api/analytics/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: userPhone,
                    sessionData: data
                })
            });
            console.log("Analytics: Report sent.");
        } catch (err) {
            console.error("Analytics: Failed to send report", err);
        }
    }
};

// Auto-init if user is logged in
if (localStorage.getItem('vAALENtine_session') === 'authenticated') {
    Analytics.init();
}
