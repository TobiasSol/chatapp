import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name='application-name' content='Chat App' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Chat App' />
        <meta name='description' content='Real-time Chat Application' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='theme-color' content='#000000' />

        {/* PWA Icons */}
        <link rel='apple-touch-icon' href='/icons/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/icons/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/icons/favicon-16x16.png' />
        <link rel='manifest' href='/manifest.json' />
        <link rel='shortcut icon' href='/favicon.ico' />

        {/* Apple Splash Screens */}
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-2048-2732.png'
          sizes='2048x2732'
        />
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-1668-2224.png'
          sizes='1668x2224'
        />
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-1536-2048.png'
          sizes='1536x2048'
        />
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-1125-2436.png'
          sizes='1125x2436'
        />
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-828-1792.png'
          sizes='828x1792'
        />
        <link
          rel='apple-touch-startup-image'
          href='/icons/apple-splash-750-1334.png'
          sizes='750x1334'
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}