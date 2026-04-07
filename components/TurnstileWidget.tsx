import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onVerify }) => {
  const siteKey = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: transparent;
          }
        </style>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body>
        <div class="cf-turnstile" 
             data-sitekey="${siteKey}" 
             data-callback="onVerify"
             data-theme="dark"></div>
        <script>
          function onVerify(token) {
            window.ReactNativeWebView.postMessage(token);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ height: 70, width: '100%', marginVertical: 10 }}>
      <WebView
        originWhitelist={['*']}
        source={{ 
          html,
          baseUrl: 'https://thedailyanswer.org' 
        }}
        onMessage={(event) => onVerify(event.nativeEvent.data)}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
      />
    </View>
  );
};

export default TurnstileWidget;
