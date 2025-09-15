import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                'palace-gold': '#F59E0B',
                'memory-purple': '#8B5CF6',
                'palace-blue': '#3B82F6',
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { 
                        transform: 'translateY(0px) rotate(0deg)',
                    },
                    '25%': { 
                        transform: 'translateY(-10px) rotate(1deg)',
                    },
                    '50%': { 
                        transform: 'translateY(-20px) rotate(0deg)',
                    },
                    '75%': { 
                        transform: 'translateY(-10px) rotate(-1deg)',
                    },
                },
            },
        },
    },

    plugins: [forms],
};
