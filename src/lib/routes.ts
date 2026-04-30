export const ROUTES = {
    home: "/",
    login: "/auth/login",
    signup: "/auth/sign-up",
    onboardingArtist: "/onboarding/artist",
    onboardingProducer: "/onboarding/producer",
    dashboard: "/dashboard",
    planningDashboard: "/dashboard/collective",
    admin: "/admin",
    authPrefix: "/auth",
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];
