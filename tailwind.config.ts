import typography from '@tailwindcss/typography'

const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './posts/**/*.mdx',
  ],
  theme: {
    extend: {},
  },
  plugins: [typography],
}
export default config
