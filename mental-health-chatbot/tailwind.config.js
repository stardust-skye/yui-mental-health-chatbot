/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class", // 👈 IMPORTANT
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}"
    ],
    theme: {
        extend: {
            colors: {
                bgLight: "#F7F8FF",
                bgDark: "#0B0F1A",
                glassDark: "rgba(255,255,255,0.08)",
                glassLight: "rgba(0,0,0,0.04)",
            }
        }
    },
    plugins: [],
}
