// Application constants
export const MAX_HABITS = 50;
export const DAYS_IN_MONTH = 31;
export const APP_NAME = 'HabitGrid';
export const DRIVE_FILE_NAME = 'habitgrid-data.json';
export const DRIVE_FOLDER_NAME = 'HabitGrid';

// Color palette
export const COLORS = {
    primary: '#4285F4',
    secondary: '#34A853',
    accent: '#FBBC05',
    danger: '#EA4335',
    gray: {
        100: '#F8F9FA',
        200: '#F1F3F4',
        300: '#E8EAED',
        400: '#DADCE0',
        500: '#BDC1C6',
        600: '#9AA0A6',
        700: '#80868B',
        800: '#5F6368',
        900: '#3C4043'
    }
};

// Emoji options for habits
export const EMOJIS = [
    '🏃', '🏋️', '🧘', '💪', '🚴', '🤸',
    '📚', '✍️', '🎯', '💡', '🧠', '🎓',
    '💧', '🥗', '🍎', '🥦', '🥛', '💊',
    '😴', '🛌', '🌅', '🌙', '🧖', '🛀',
    '🎨', '🎵', '🎸', '📷', '🎮', '🎭',
    '💼', '💰', '📈', '🔄', '🎪', '🌟'
];

// Default habit categories with colors
export const HABIT_CATEGORIES = [
    { name: 'Health & Fitness', color: '#34A853', icon: '💪' },
    { name: 'Learning', color: '#4285F4', icon: '📚' },
    { name: 'Productivity', color: '#FBBC05', icon: '🎯' },
    { name: 'Mindfulness', color: '#8B5CF6', icon: '🧘' },
    { name: 'Creativity', color: '#EC4899', icon: '🎨' },
    { name: 'Finance', color: '#10B981', icon: '💰' }
];

// Days of week
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Months
export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Google OAuth scopes
export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

// Local storage keys
export const STORAGE_KEYS = {
    HABITS: 'habitgrid_habits',
    SETTINGS: 'habitgrid_settings',
    USER: 'habitgrid_user',
    LAST_SYNC: 'habitgrid_last_sync',
    THEME: 'habitgrid_theme'
};

// App settings defaults
export const DEFAULT_SETTINGS = {
    autoSave: true,
    showPercentages: true,
    notifications: true,
    defaultGoal: 20,
    theme: 'light',
    weekStartsOn: 0 // 0 = Sunday, 1 = Monday
};

// Export types
export const EXPORT_TYPES = {
    JSON: 'json',
    CSV: 'csv',
    PDF: 'pdf'
};
