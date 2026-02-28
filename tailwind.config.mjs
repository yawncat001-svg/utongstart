/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
      colors: {
        primary: {
          50:  '#EFF4F9',
          100: '#D1DEE9',
          200: '#A3BDD6',
          300: '#6B8EB5',
          400: '#3D6491',
          500: '#1E3A5F',
          600: '#234B82',
          700: '#1B3A66',
          800: '#152E54',
          900: '#0F2342',
          950: '#0A1628',
        },
        accent: {
          100: '#FFF0EC',
          200: '#FFCABC',
          300: '#FFA48A',
          400: '#FF7A59',
          500: '#FF5733',
          600: '#E04E2D',
          700: '#C43D22',
        },
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          800: '#2E2E2E',
          900: '#171717',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'section': ['2.25rem', { lineHeight: '1.3', fontWeight: '700' }],
      },
      maxWidth: {
        'content': '1200px',
      }
    },
	},
	plugins: [],
}