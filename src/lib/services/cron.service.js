import cron from 'node-cron';

export class CronService {
    static isInitialized = false;

    static init() {
        if (this.isInitialized) return;
        
        console.log('Initializing (Cron)...');

        const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";
        // Use PORT if available (e.g., local dev) or NEXT_PUBLIC_APP_URL
        const port = process.env.PORT || 3000;
        const defaultUrl = `http://localhost:${port}`;
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || defaultUrl;

        // Helper to trigger API routes
        const runJob = async (path, name) => {
            try {
                // Ensure we use the proper local URL for internal calls if not in production
                const url = process.env.NODE_ENV === 'production' 
                  ? `${APP_URL}${path}` 
                  : `${defaultUrl}${path}`;
                  
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CRON_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                const data = await response.json();
                if (response.ok) {
                    console.log(`[CRON] ${name} executed successfully.`);
                } else {
                    console.error(`[CRON] ${name} failed with status: ${response.status}`, data);
                }
            } catch (error) {
                console.error(`[CRON] Error executing ${name}:`, error.message);
            }
        };

        // Schedule: Plan Expiry (Daily at midnight)
        cron.schedule('0 0 * * *', () => {
            runJob('/api/cron/plan-expiry', 'Plan Expiry');
        });

        // Schedule: Trending Topics & Blogs (Weekly on Sunday at midnight)
        cron.schedule('0 0 * * 0', () => {
            runJob('/api/cron/trending-topics', 'Trending Topics');
            runJob('/api/cron/trending-career', 'Trending Career');
            runJob('/api/cron/trending-premium', 'Trending Premium');
            runJob('/api/cron/generate-weekly-blogs', 'Weekly Blogs');
        });

        console.log('Cron Service started successfully.');
        this.isInitialized = true;
    }
}
