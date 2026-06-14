import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
}

const RecaptchaWidget: React.FC<RecaptchaWidgetProps> = ({ onVerify }) => {
  const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);

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
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body>
        <div class="g-recaptcha" 
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
    <View style={{ width: '100%', marginVertical: 10 }}>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        className={`flex-row items-center justify-center rounded-2xl py-4 ${
          isVerified ? 'bg-emerald-600' : 'bg-slate-800'
        }`}
      >
        <Ionicons
          name={isVerified ? 'checkmark-circle' : 'shield-checkmark-outline'}
          size={20}
          color="#FFF"
        />
        <Text className="ml-2 font-semibold text-white">
          {isVerified ? 'Security check complete' : 'Verify you are not a robot'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-5">
          <View className="w-full overflow-hidden rounded-2xl bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-base font-bold text-gray-900">
                Security Check
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 520, width: '100%' }}>
              <WebView
                originWhitelist={['*']}
                source={{
                  html,
                  baseUrl: 'https://thedailyanswer.org',
                }}
                onMessage={(event) => {
                  setIsVerified(true);
                  setIsOpen(false);
                  onVerify(event.nativeEvent.data);
                }}
                style={{ backgroundColor: 'transparent' }}
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RecaptchaWidget;
