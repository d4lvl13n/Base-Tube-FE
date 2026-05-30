import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only HTML shell. Sets a global dark page background so no white area
 * shows through where react-native-web does not paint a view's background
 * (e.g. empty FlatList scroll space). Native uses the splash backgroundColor.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body, #root { background-color: #09090B; } body { margin: 0; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
