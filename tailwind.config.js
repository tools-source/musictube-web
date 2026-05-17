/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#FF3B6B',
        'accent-dim': 'rgba(255,59,107,0.15)',
        'bg-top': '#05050C',
        'bg-bottom': '#0A0A17',
        'card': 'rgba(255,255,255,0.06)',
        'control': 'rgba(255,255,255,0.10)',
        'control-strong': 'rgba(255,255,255,0.14)',
        'glass-stroke': 'rgba(255,255,255,0.08)',
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(235,235,245,0.60)',
        'text-tertiary': 'rgba(235,235,245,0.30)',
        'divider': 'rgba(255,255,255,0.08)',
        'progress-track': 'rgba(255,255,255,0.18)',
        'progress-buffered': 'rgba(255,255,255,0.35)',
      },
      backdropBlur: { xs: '4px' },
    },
  },
  plugins: [],
}
