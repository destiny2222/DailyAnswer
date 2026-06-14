import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const TAB_ICON_NAMES: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  resources: 'book',
  note: 'document-text',
  profile: 'person',
};

const TabIcon = ({
  routeName,
  isFocused,
}: {
  routeName: string;
  isFocused: boolean;
}) => {
  const iconName = TAB_ICON_NAMES[routeName];
  const scale = useSharedValue(isFocused ? 1.2 : 1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.2 : 1, {
      stiffness: 200,
      damping: 10,
    });
  }, [isFocused, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!iconName) return null;

  return (
    <Animated.View style={animatedIconStyle}>
      <Ionicons
        name={isFocused ? iconName : `${iconName}-outline` as keyof typeof Ionicons.glyphMap}
        size={24}
        color="#FFFFFF"
      />
    </Animated.View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  
  // Filter for allowed routes
  const visibleRoutes = useMemo(() => {
    const allowedRoutes = ['index', 'resources', 'note', 'profile'];
    return state.routes.filter((route: any) => {
      const { options } = descriptors[route.key];
      return options.href !== null && allowedRoutes.includes(route.name);
    });
  }, [state.routes, descriptors]);

  const translateX = useSharedValue(0);
  
  // paddingHorizontal: 1 is used in styles.tabBarMain
  const TAB_BAR_PADDING = 1;
  const contentWidth = barWidth - (TAB_BAR_PADDING * 2);
  const tabWidth = contentWidth > 0 ? contentWidth / visibleRoutes.length : 0;
  
  // Pill dimensions
  const pillWidth = tabWidth > 14 ? tabWidth - 14 : tabWidth; // Padding inside the slot

  useEffect(() => {
    const activeRoute = state.routes[state.index];
    const visibleIndex = visibleRoutes.findIndex((r: any) => r.key === activeRoute.key);
    
    if (visibleIndex !== -1 && tabWidth > 0) {
      // Calculate start position: padding + index * tabWidth + margin for centering
      const startPos = TAB_BAR_PADDING + (visibleIndex * tabWidth) + (tabWidth - pillWidth) / 2;
      translateX.value = withSpring(startPos, {
         damping: 15,
         stiffness: 120,
      });
    }
  }, [pillWidth, state.index, state.routes, tabWidth, translateX, visibleRoutes]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: barWidth > 0 ? 1 : 0,
  }));

  return (
    <View style={[styles.container, { bottom: insets.bottom + 10 }]}>
      <View 
        style={styles.tabBarMain}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Animated Background Pill */}
        {tabWidth > 0 && (
          <Animated.View 
            style={[
              styles.activePill, 
              { width: pillWidth },
              animatedPillStyle
            ]} 
          />
        )}

        {visibleRoutes.map((route: any) => {
          const isFocused = state.routes[state.index].key === route.key;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <TabIcon routeName={route.name} isFocused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarMain: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 35,
    height: 70,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  activePill: {
    position: 'absolute',
    height: 50,
    backgroundColor: '#E94B7B',
    borderRadius: 25,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="resources" options={{ title: 'Devotional' }} />
      <Tabs.Screen name="note" options={{ title: 'Note' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="memory" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="prayer" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="edit_profile" options={{ href: null }} />
      <Tabs.Screen name="ManageSupport" options={{ href: null }} />
      <Tabs.Screen name="changedPassword" options={{ href: null }} />
    </Tabs>
  );
}
