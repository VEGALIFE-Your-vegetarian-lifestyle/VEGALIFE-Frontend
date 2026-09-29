/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === VEGALIFE BRAND PALETTE ===
        // Primary Green — Main brand color for buttons, links, active states
        vegan: {
          green: '#2E9D68',
          'green-hover': '#268A5A',
          'green-active': '#1F7A4D',
          'green-light': '#E8F5EE',
          'green-muted': '#A8D5BC',
        },
        // Light Green — Subtle vegetarian/nutrition states, badges, tags
        lightgreen: '#E8F5EE',
        // Cream — Warm food-related sections, recipe cards, secondary highlights
        cream: '#FFF8E7',
        // Terracotta — Secondary accent for food categories, small visual details
        terracotta: '#D9795B',
        'terracotta-hover': '#C46A4E',
        // Dark — Headings, primary text, navigation text
        dark: '#20352B',
        'dark-hover': '#1A2B23',
        // Background — Main application background (neutral warm white)
        background: '#FCFBF7',
        // Semantic colors derived from palette
        foreground: '#20352B',
        border: '#E0DDD5',
        input: '#E0DDD5',
        ring: '#2E9D68',
        primary: '#2E9D68',
        'primary-foreground': '#FFFFFF',
        secondary: '#F5F4F0',
        'secondary-foreground': '#20352B',
        muted: '#F5F4F0',
        'muted-foreground': '#6B6560',
        accent: '#E8F5EE',
        'accent-foreground': '#20352B',
        destructive: '#D9795B',
        'destructive-foreground': '#FFFFFF',
        popover: '#FFFFFF',
        'popover-foreground': '#20352B',
        card: '#FFFFFF',
        'card-foreground': '#20352B',
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '12px': '12px',
        '16px': '16px',
        '20px': '20px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '64px': '64px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
