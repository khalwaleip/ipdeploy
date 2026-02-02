/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                legal: {
                    900: '#0f172a',
                    800: '#1e293b',
                    700: '#334155',
                    gold: '#cca43b',
                    goldLight: '#e5c15d',
                }
            }
        },
    },
    plugins: [],
}
