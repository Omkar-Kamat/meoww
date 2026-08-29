import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import '@radix-ui/themes/styles.css';
import '@fontsource/geist-sans';
import './index.css';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <Theme appearance="dark" accentColor="ruby" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
        <App />
      </Theme>
    </ThemeProvider>
  </StrictMode>,
)
