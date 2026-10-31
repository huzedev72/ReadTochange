import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E0E",
        sun: "#FFA83A",
        paper: "#FFFFFF",
        warmbg: "#FFF8EE",
        line: "#E6DCCB",
        muted: "#5B5348",
        glass: "rgba(255, 255, 255, 0.14)",
        "glass-border": "rgba(255, 255, 255, 0.3)",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        playfair: ["var(--font-playfair)", "'Playfair Display'", "Georgia", "serif"],
      },
      borderRadius: {
        pill: "28px",
        card: "28px",
        chip: "22px",
        phone: "44px",
      },
      boxShadow: {
        hard: "8px 8px 0px #0E0E0E",
        "hard-sun": "8px 8px 0px #FFA83A",
        "hard-sm": "4px 4px 0px #0E0E0E",
        "hard-sun-sm": "4px 4px 0px #FFA83A",
        "hard-white": "8px 8px 0px #FFFFFF",
      },
    },
  },
  plugins: [],
};

export default config;
