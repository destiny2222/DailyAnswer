import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '../../../constants/icons';

const SupportItem = ({ icon, title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between bg-slate-800 p-4 rounded-lg mb-4"
  >
    <View className="flex-row items-center">
      <Image source={icon} className="w-6 h-6 mr-4" resizeMode="contain" style={{ tintColor: '#FF6B6B' }}/>
      <Text className="text-lg font-semibold text-white">{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
  </TouchableOpacity>
);

const EmailSupportModal = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="slide"  onRequestClose={onClose}>
    <TouchableOpacity className="flex-1 justify-end bg-black/50" activeOpacity={1} onPressOut={onClose}>
      <View className="bg-slate-800 rounded-t-2xl p-6">
        <View className="items-center mb-6">
          <View className="w-12 h-1.5 bg-gray-500 rounded-full" />
        </View>
        <Text className="text-2xl font-bold text-center mb-4 text-white">Email Support</Text>
        
        <Text className="text-lg font-semibold mb-2 text-white">Contact Us</Text>
        <Text className="text-base text-gray-300 mb-4">
          If you need assistance or have any questions, please feel free to contact our support team. We are here to help!
        </Text>

        <Text className="text-lg font-semibold mb-2 text-white">Email Us</Text>
        <View className="mb-4">
          <Text className="text-base text-gray-300 mb-1">
            - For Support: <Text className="text-blue-400">support@thedailyanswer.org</Text>
          </Text>
          <Text className="text-base text-gray-300 mb-1">
            - For Feedback: <Text className="text-blue-400">feedback@thedailyanswer.org</Text>
          </Text>
          <Text className="text-base text-gray-300">
            - For Business Inquiries: <Text className="text-blue-400">business@thedailyanswer.org</Text>
          </Text>
        </View>

        <Text className="text-lg font-semibold mb-2 text-white">What to Include in Your Email</Text>
        <Text className="text-base text-gray-300 mb-2">
          Your Name and Contact Information
        </Text>
        <Text className="text-base text-gray-300 mb-2">
          A detailed description of your issue or feedback
        </Text>
        <Text className="text-base text-gray-300">
          Screenshots or other relevant attachments (if applicable)
        </Text>
      </View>
    </TouchableOpacity>
  </Modal>
);

const TermsOfServiceModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 justify-end bg-black/50" activeOpacity={1} onPressOut={onClose}>
        <View className="bg-slate-800 rounded-t-2xl p-6 max-h-[80vh]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-gray-500 rounded-full" />
          </View>
          <Text className="text-2xl font-bold text-center mb-4 text-white">Terms of Service</Text>
          <ScrollView>
            <Text className="text-lg font-semibold mb-2 text-white">Introduction</Text>
            <Text className="text-base text-gray-300 mb-4">
              Welcome to The Daily Answer Devotional! By accessing our app, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our app.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Eligibility</Text>
            <Text className="text-base text-gray-300 mb-4">
              You must be at least 13 years old to use our app. By agreeing to these Terms, you represent and warrant that you meet the minimum age requirement.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Account Registration</Text>
            <Text className="text-base text-gray-300 mb-4">
              To access certain features of the app, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">User Conduct</Text>
            <Text className="text-base text-gray-300 mb-4">
              You are solely responsible for your conduct while using our app and for any data, text, information, usernames, graphics, images, photographs, profiles, audio, video, items, and links (collectively, "Content") that you submit, post, and display on our app.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Prohibited Activities</Text>
            <Text className="text-base text-gray-300 mb-4">
              You agree not to engage in the following prohibited activities: illegal or unauthorized use of our app, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email. Divesting user accounts by automated means or under false pretenses. Transmitting any worms or viruses or any code of a destructive nature.
            </Text>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  const PrivacyPolicyModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 justify-end bg-black/50" activeOpacity={1} onPressOut={onClose}>
        <View className="bg-slate-800 rounded-t-2xl p-6 max-h-[80vh]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-gray-500 rounded-full" />
          </View>
          <Text className="text-2xl font-bold text-center mb-4 text-white">Privacy Policy</Text>
          <ScrollView>
            <Text className="text-lg font-semibold mb-2 text-white">Introduction</Text>
            <Text className="text-base text-gray-300 mb-4">
              Welcome to The Daily Answer Devotional! Your privacy is important to us. This Policy explains how we collect, use, disclose, and safeguard your information when you visit our mobile application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the app.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Information Collection and Use</Text>
            <Text className="text-base text-gray-300 mb-4">
              Personal Data: We collect personal data that you voluntarily provide to us when registering at the app, expressing an interest in obtaining information about us or our products and services, when participating in activities on the app or otherwise contacting us. The personal data we collect may include your name, email address, phone number, and other contact details.
            </Text>
  
            <Text className="text-base text-gray-300 mb-4">
              Usage Data: When you access the app, we may also collect certain information automatically, including, but not limited to, the type of mobile device you use, your mobile device's unique ID, the IP address of your mobile device, your mobile operating system, the type of mobile Internet browser you use, unique device identifiers and other diagnostic data.
            </Text>
  
            <Text className="text-base text-gray-300 mb-4">
              Location Information: We may request access or permission to and track location-based information from your mobile device, either continuously or while you are using our mobile application, to provide location-based services.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Cookies and Tracking Technologies</Text>
            <Text className="text-base text-gray-300 mb-4">
              We use cookies and similar tracking technologies to track the activity on our app and hold certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze our app.
            </Text>
  
            <Text className="text-lg font-semibold mb-2 text-white">Third-Party Service Providers</Text>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

const Security = () => {
  const router = useRouter();
    const [isEmailModalVisible, setEmailModalVisible] = useState(false);
    const [isTermsModalVisible, setTermsModalVisible] = useState(false);
    const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-center flex-1 text-white">Support</Text>
          <View className="w-10" />
        </View>
  
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text className="text-base text-gray-300 mb-8 leading-6">
            Dear users! We hope you like this app. But if you have any problems, questions, or just want to encourage us, we would love to hear from you. Any review about the app!
          </Text>
  
          <SupportItem
            icon={icons.message}
            title="Email Support"
            onPress={() => setEmailModalVisible(true)}
          />
          <SupportItem
            icon={icons.lock}
            title="Terms of Service"
            onPress={() => setTermsModalVisible(true)}
          />
          <SupportItem
            icon={icons.privacy}
            title="Privacy Policy"
            onPress={() => setPrivacyModalVisible(true)}
          />
        </ScrollView>
  
        <EmailSupportModal
          visible={isEmailModalVisible}
          onClose={() => setEmailModalVisible(false)}
        />
        <TermsOfServiceModal
          visible={isTermsModalVisible}
          onClose={() => setTermsModalVisible(false)}
        />
        <PrivacyPolicyModal
          visible={isPrivacyModalVisible}
          onClose={() => setPrivacyModalVisible(false)}
        />
      </SafeAreaView>
    );
  };
  
export default Security;