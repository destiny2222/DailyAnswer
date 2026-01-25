import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import imgOne from '../../assets/images/onboarding/img-one.jpeg';
import imgThree from '../../assets/images/onboarding/img-three.jpeg';
import imgTwo from '../../assets/images/onboarding/img-two.jpeg';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  quote: string;
  author?: string;
  image: any;
  overlayColor: string;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    quote: 'For Peace to be real must be unaffected by outside circumstances',
    author: 'Daily Devotional',
    image: imgOne,
    overlayColor: 'rgba(30, 41, 59, 0.7)',
  },
  {
    id: '2',
    quote: 'The Lord is my strength and my shield; my heart trusts in Him',
    author: 'Psalm 28:7',
    image: imgTwo,
    overlayColor: 'rgba(51, 65, 85, 0.7)',
  },
  {
    id: '3',
    quote: 'Trust in the Lord with all your heart and lean not on your own understanding',
    author: 'Proverbs 3:5',
    image: imgThree,
    overlayColor: 'rgba(71, 85, 105, 0.7)',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = async () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await SecureStore.setItemAsync("onboarding_completed", "true");
        // console.log("Onboarding status saved.");
        router.replace('/(root)/(tabs)');
      } catch (error) {
        console.error("Error saving onboarding status:", error);
        // Still navigate even if save fails
        router.replace('/(root)/(tabs)');
      }
    }
  };

  const skip = async () => {
    try {
      await SecureStore.setItemAsync("onboarding_completed", "true");
      router.replace('/(root)/(tabs)');
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      // Still navigate even if save fails
      router.replace('/(root)/(tabs)');
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={{ width, height }}>
      <ImageBackground
        source={item.image}
        style={{ width, height }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', item.overlayColor, item.overlayColor]}
          style={{ flex: 1 }}
        >
          <StatusBar barStyle="light-content" />
          
          {/* Skip Button */}
          <View className="w-full items-end pt-12 px-6">
            <TouchableOpacity onPress={skip} className="py-2 px-4">
              <Text className="text-white text-base font-medium">Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Quote Content */}
          <View className="px-8 pb-32">
            <Text className="text-white text-3xl font-bold leading-tight mb-4">
              {item.quote}
            </Text>
            {item.author && (
              <Text className="text-white/80 text-base font-medium">
                — {item.author}
              </Text>
            )}
          </View>

          {/* Bottom Navigation */}
          <View className="px-8 pb-12">
            {/* Pagination Dots */}
            <View className="flex-row items-center mb-6">
              {onboardingData.map((_, index) => {
                const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 24, 8],
                  extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index.toString()}
                    style={{
                      width: dotWidth,
                      opacity,
                    }}
                    className="h-2 bg-[#E94B7B] rounded-full mr-2"
                  />
                );
              })}
            </View>

            {/* Next Button */}
            {currentIndex < onboardingData.length - 1 ? (
              <TouchableOpacity
                onPress={scrollTo}
                className="bg-[#E94B7B] rounded-full w-16 h-16 items-center justify-center self-end"
                activeOpacity={0.8}
              >
                <Text className="text-white text-2xl">→</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={scrollTo}
                className="bg-[#E94B7B] rounded-full w-full py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white text-lg font-semibold">Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
    </View>
  );
}
