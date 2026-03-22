// src/instrumentation.js
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { CronService } = await import('./lib/services/cron.service.js');
        CronService.init();
    }
}
