import cron from 'node-cron';
import { getCronSecret } from '@/api/cron/_lib';

export class CronService {
    static isInitialized = false;

    static init() {
        if (this.isInitialized) return;

        const isProduction = process.env.NODE_ENV === 'production';
        const enableInternalCron = process.env.ENABLE_INTERNAL_CRON === 'true';
        const cronSecret = getCronSecret();

        if (isProduction && !enableInternalCron) {
            console.log('[CRON] Internal scheduler disabled in production. Use Vercel cron or set ENABLE_INTERNAL_CRON=true.');
            this.isInitialized = true;
            return;
        }

        if (!cronSecret) {
            console.warn('[CRON] Internal scheduler not started because CRON_SECRET is missing.');
            this.isInitialized = true;
            return;
        }

        console.log('[CRON] Initializing internal scheduler...');

        const port = process.env.PORT || 3000;
        const defaultUrl = `http://localhost:${port}`;
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || defaultUrl;

        // Helper to trigger API routes
        const runJob = async (path, name) => {
            try {
                const baseUrl = isProduction ? appUrl : defaultUrl;
                const url = `${baseUrl}${path}`;
                  
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cronSecret}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};
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
        }, { timezone: 'UTC' });

        // Schedule: Trending Topics & Blogs (Weekly on Sunday at midnight)
        cron.schedule('0 0 * * 0', () => {
            runJob('/api/cron/trending-topics', 'Trending Topics');
            runJob('/api/cron/trending-career', 'Trending Career');
            runJob('/api/cron/trending-premium', 'Trending Premium');
            runJob('/api/cron/generate-weekly-blogs', 'Weekly Blogs');
        }, { timezone: 'UTC' });

        console.log('[CRON] Internal scheduler started successfully.');
        this.isInitialized = true;
    }
}
