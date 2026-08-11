import type { Config } from 'tailwindcss';
import { kinetixPreset } from '@kinetix/ui/tailwind-preset';

const config: Config = {
  presets: [kinetixPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
};
export default config;
