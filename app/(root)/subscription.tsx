import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmPayment, createPaymentIntent } from '../../libs/payment';

const SubscriptionScreen = () => {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // 1. Create payment intent
      const clientSecret = await createPaymentIntent();
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Daily Answer',
        returnURL: 'dailyanswer://subscription',
        defaultBillingDetails: {
          name: '',
        },
      });

      if (initError) {
        
        Alert.alert('Error', initError.message);
        setLoading(false);
        return;
      }

      setLoading(false);

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        
        Alert.alert('Payment Cancelled', presentError.message);
        return;
      }
      // 4. Payment successful, confirm on backend
      setProcessing(true);
      
      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      const confirmResponse = await confirmPayment(paymentIntentId);

      setProcessing(false);

      if (confirmResponse.success) {
        Alert.alert(
          'Success! 🎉',
          'Your subscription is now active. Enjoy unlimited access!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Payment confirmation failed. Please contact support.');
      }
    } catch (error: any) {
      setLoading(false);
      setProcessing(false);
      
      // Show more detailed error
      const errorMessage = error.message || 'Something went wrong';
      Alert.alert(
        'Payment Error', 
        `${errorMessage}\n\nPlease check console for details.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4 text-gray-800">
          Subscribe to Premium
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="bg-pink-100 rounded-full p-6 mb-4">
              <Ionicons name="sparkles" size={48} color="#E94B7B" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
              Premium Access
            </Text>
            <Text className="text-gray-600 text-center text-lg">
              Unlock the full experience
            </Text>
          </View>

          {/* Price */}
          <View className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 mb-6 items-center">
            <Text className="text-black text-sm mb-1">Annual Subscription</Text>
            <View className="flex-row items-baseline">
              <Text className="text-black text-5xl font-bold">$10</Text>
              <Text className="text-black text-2xl">.99</Text>
              <Text className="text-black text-lg ml-2">/year</Text>
            </View>
            <Text className="text-black text-sm mt-2 opacity-90">
              Less than $1 per month!
            </Text>
          </View>

          {/* Features */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              What's Included:
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row items-start mb-4">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Unlimited Devotionals
                  </Text>
                  <Text className="text-gray-600">
                    Access thousands of daily devotionals and Bible studies
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Offline Reading
                  </Text>
                  <Text className="text-gray-600">
                    Download and read devotionals without internet
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Ad-Free Experience
                  </Text>
                  <Text className="text-gray-600">
                    Enjoy uninterrupted spiritual growth
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Exclusive Bible Plans
                  </Text>
                  <Text className="text-gray-600">
                    Access premium reading plans and study guides
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Priority Support
                  </Text>
                  <Text className="text-gray-600">
                    Get help whenever you need it
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            className="bg-[#E94B7B] py-5 rounded-full shadow-lg mb-4"
            onPress={handleSubscribe}
            disabled={loading || processing}
            activeOpacity={0.8}
          >
            {loading || processing ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#FFF" />
                <Text className="text-white text-lg font-bold ml-2">
                  {loading ? 'Preparing...' : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-bold text-center">
                Subscribe Now
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text className="text-gray-500 text-xs text-center mb-8">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscription will auto-renew annually. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
