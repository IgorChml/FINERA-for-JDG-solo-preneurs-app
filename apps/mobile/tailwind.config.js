/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A56DB',
          50: '#EBF0FD',
          100: '#C7D5F9',
          200: '#8FADF4',
          300: '#5784EF',
          400: '#2563EB',
          500: '#1A56DB',
          600: '#1546BA',
          700: '#103799',
          800: '#0C2A78',
          900: '#071D57',
        },
        success: {
          DEFAULT: '#0E9F6E',
          50: '#E3F9F0',
          100: '#BAF0D9',
          500: '#0E9F6E',
          600: '#0B8A5E',
        },
        warning: {
          DEFAULT: '#E3A008',
          50: '#FDF6E3',
          100: '#FAEAB5',
          500: '#E3A008',
          600: '#C88A00',
        },
        danger: {
          DEFAULT: '#E02424',
          50: '#FDE8E8',
          100: '#F9BEBE',
          500: '#E02424',
          600: '#C11A1A',
        },
        surface: '#FFFFFF',
        'surface-dark': '#1F2937',
        background: '#F9FAFB',
        'background-dark': '#111827',
        border: '#E5E7EB',
        'border-dark': '#374151',
        muted: '#6B7280',
        'muted-dark': '#9CA3AF',
      },
      fontFamily: {
        'sora': ['Sora-Regular'],
        'sora-semibold': ['Sora-SemiBold'],
        'sora-bold': ['Sora-Bold'],
        'inter': ['Inter-Regular'],
        'inter-medium': ['Inter-Medium'],
        'inter-semibold': ['Inter-SemiBold'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'badge': '8px',
      },
      boxShadow: {
        'card': '0 4px 8px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
