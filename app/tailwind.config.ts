import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        falconWhite: {
          DEFAULT: '#F3EDF3',
        },
        lunarBlack: {
          DEFAULT: '#0E120F',
        },
        metals: {
          light: '#F8852C',
          full: '#F8852C',
        },
        volatiles: {
          light: '#5BC0F5',
          full: '#5BC0F5',
        },
        fissiles: {
          light: '#8A1AFF',
          full: '#8A1AFF',
        },
        organics: {
          light: '#68D346',
          full: '#68D346',
        },
        rareEarths: {
          light: '#F63637',
          full: '#F63637',
        },
        falcon: {
          50: '#F8F4F9',
          100: '#F3ECF3',
          200: '#E8DCE9',
          300: '#DAC6DB',
          400: '#CBAECA',
          500: '#BC98BA',
          600: '#A982A3',
          700: '#936F8D',
          800: '#785B73',
          900: '#624D5F',
          950: '#3E313C',
        },
        fuscousGray: {
          50: '#F5F5F1',
          100: '#E5E5DC',
          200: '#CCCDBB',
          300: '#B1B093',
          400: '#9A9875',
          500: '#8B8767',
          600: '#777257',
          700: '#605948',
          800: '#534D40',
          900: '#3E3931',
          950: '#29241F',
        },
        lunarGreen: {
          50: '#F5F8F5',
          100: '#E0E7E1',
          200: '#C0CFC0',
          300: '#98B099',
          400: '#728F74',
          500: '#58745B',
          600: '#455C48',
          700: '#3A4B3D',
          800: '#313E33',
          900: '#2C352E',
          950: '#161D18',
        },
        mako: {
          50: '#F6F7F9',
          100: '#EDEEF1',
          200: '#D7DBE0',
          300: '#B3BBC6',
          400: '#8A96A6',
          500: '#6C7A8B',
          600: '#566273',
          700: '#464F5E',
          800: '#3D454F',
          900: '#31363E',
          950: '#24272D',
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 2px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config