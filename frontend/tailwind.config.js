/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Netflix tarzı renkler
                netflix: {
                    red: '#E50914',
                    black: '#141414',
                    darkGray: '#1a1a1a',
                    gray: '#2f2f2f',
                    lightGray: '#808080',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
