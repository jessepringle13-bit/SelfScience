/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{js,jsx}',
      './components/**/*.{js,jsx}',
      './app/**/*.{js,jsx}',
      './lib/**/*.{js,jsx}',
      './src/**/*.{js,jsx}',
    ],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px'
        }
      },
      extend: {
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
          ss: {
            // Brand colors — CSS-variable driven so `.dark` on <html>
            // can flip them to lighter values that stay readable on
            // dark surfaces. Fallback literals are the original
            // light-mode values so any pre-CSS-var usage still works.
            teal: 'var(--ss-teal, #1B474D)',
            'teal-dark': 'var(--ss-teal-dark, #123539)',
            'teal-ink': 'var(--ss-teal-ink, #0F2A2E)',
            orange: 'var(--ss-orange, #C45820)',
            'orange-dark': 'var(--ss-orange-dark, #A5471A)',
            green: 'var(--ss-green, #2E7D32)',
            amber: 'var(--ss-amber, #964219)',
            red: 'var(--ss-red, #B23A3A)',
            critical: 'var(--ss-critical, #A12C7B)',
            'preprint-yellow': 'var(--ss-preprint-yellow, #B07D00)',
            'editorial-blue': 'var(--ss-editorial-blue, #006494)',
            // Surfaces / neutrals — driven by CSS variables so a single
            // `.dark` class on <html> swaps the entire palette. Fallback
            // literals are the original light-mode values so pre-CSS-var
            // usage stays identical.
            canvas: 'var(--ss-canvas, #0F2A2E)',
            bg: 'var(--ss-bg, #F7F6F2)',
            surface: 'var(--ss-surface, #F9F8F5)',
            text: 'var(--ss-text, #28251D)',
            muted: 'var(--ss-muted, #7A7974)',
            'border-warm': 'var(--ss-border-warm, #D4D1CA)',
            'row-alt': 'var(--ss-row-alt, #EEF7F7)',
            'privacy-tint': 'var(--ss-privacy-tint, #EAF5F5)',
          },
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))'
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))'
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))'
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))'
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))'
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))'
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))'
          },
          chart: {
            '1': 'hsl(var(--chart-1))',
            '2': 'hsl(var(--chart-2))',
            '3': 'hsl(var(--chart-3))',
            '4': 'hsl(var(--chart-4))',
            '5': 'hsl(var(--chart-5))'
          },
          sidebar: {
            DEFAULT: 'hsl(var(--sidebar-background))',
            foreground: 'hsl(var(--sidebar-foreground))',
            primary: 'hsl(var(--sidebar-primary))',
            'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
            accent: 'hsl(var(--sidebar-accent))',
            'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
            border: 'hsl(var(--sidebar-border))',
            ring: 'hsl(var(--sidebar-ring))'
          }
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)'
        },
        keyframes: {
          'accordion-down': {
            from: {
              height: '0'
            },
            to: {
              height: 'var(--radix-accordion-content-height)'
            }
          },
          'accordion-up': {
            from: {
              height: 'var(--radix-accordion-content-height)'
            },
            to: {
              height: '0'
            }
          }
        },
        animation: {
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out'
        }
      }
    },
    plugins: [require("tailwindcss-animate")],
  }