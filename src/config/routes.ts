// Route configuration
export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    AUTH: '/auth',
    LOGIN: '/login',
    REGISTER: '/register',
    TASKS: '/tasks',
    TASK_DETAIL: (id: string) => `/tasks/${id}`,
    REVIEWS: '/reviews',
    DISPUTES: '/disputes',
    ADMIN: '/admin',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    NOT_FOUND: '/404',
} as const;

// Navigation items
export const NAV_ITEMS = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Tasks', path: ROUTES.TASKS },
    { label: 'Reviews', path: ROUTES.REVIEWS },
] as const;
