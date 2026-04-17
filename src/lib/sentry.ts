export const initSentry = () => {
    if (process.env.NODE_ENV === 'production') {
        // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
        console.log('Sentry initialized (stub)');
    }
};
