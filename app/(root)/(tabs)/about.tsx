import images from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutSection = ({ title, children }) => (
  <View className="mb-8">
    <Text className="text-xl font-bold text-white mb-3 font-rubik-semibold">{title}</Text>
    <Text className="text-base text-gray-300 leading-7 font-rubik-regular font-normal">{children}</Text>
  </View>
);

const AboutScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Image
            source={images.logo}
            className="w-10 h-10"
            resizeMode="contain"
          />
        </View>
        <View className="w-10" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-10">
          <Text className="text-2xl font-extrabold text-white tracking-wider font-rubik-extrabold">
            ABOUT THE PUBLISHER
          </Text>
        </View>

        <AboutSection title="Our Mission">
          At Urgent Message Production Ministry, our mission is to inspire,
          uplift, and enrich your spiritual journey by providing daily
          devotional content that connects you with God's Word. We are
          committed to offering insightful, thought-provoking reflections that
          help you to grow in faith and apply Biblical truths to everyday life.
        </AboutSection>

        <AboutSection title="Our History">
          Founded in 2010 by Pastor Mabel Tabu, The Daily Answer devotional
          was written by a small community of faith-driven individuals. Over
          the years, The Daily Answer devotional has become a trusted resource
          for thousands of believers worldwide, dedicated to spreading the love
          and teachings of Jesus Christ.
        </AboutSection>

        <AboutSection title="Our Team">
          Our content is created by a diverse team of theologians, pastors, and
          writers who are deeply rooted in scriptural knowledge and passionate
          about evangelism. Each devotional is crafted with care, prayer, and
          deep contemplation to ensure that it speaks to your heart and meets
          you where you are in your faith journey.
        </AboutSection>

        <AboutSection title="Our Vision">
          We envision a world where every believer has the tools to deepen
          their relationship with Christ every day. Our app serves as a
          personal companion in your daily walk with God, providing
          accessible, engaging, and spiritually enriching content that
          encourages and challenges you to live a life of purpose and faith.
        </AboutSection>

        <AboutSection title="Our Commitment">
          We are committed to maintaining the highest integrity in our work and
          to ensuring that our app is a safe, respectful, and inclusive space
          for all believers. We continuously strive to improve and update our
          app based on user feedback and theological insights to better serve
          our global community.
        </AboutSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
