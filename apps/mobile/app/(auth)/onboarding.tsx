import { useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  type ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useOnboardingStore } from '../../stores/onboarding.store';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🧾',
    title: 'Faktury w jednym miejscu',
    subtitle:
      'Połącz się z KSeF i zarządzaj wszystkimi fakturami sprzedaży i zakupów. Automatyczna synchronizacja co dzień o 6:00.',
    gradient: ['#1A56DB', '#2563EB'],
  },
  {
    id: '2',
    emoji: '🤖',
    title: 'AI Doradca Podatkowy',
    subtitle:
      'Zeskanuj paragon i dowiedz się w 3 sekundy czy to koszt firmowy. Nasze AI zna polskie prawo podatkowe i zawsze podaje podstawę prawną.',
    gradient: ['#0E9F6E', '#059669'],
  },
  {
    id: '3',
    emoji: '💰',
    title: 'Zawsze wiesz ile odłożyć',
    subtitle:
      'FINERA automatycznie oblicza VAT, PIT i ZUS. Nigdy więcej niespodzianki na koniec kwartału.',
    gradient: ['#E3A008', '#D97706'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setComplete } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await setComplete(true);
    router.replace('/(auth)/register');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={{ width }} className="flex-1 px-8 items-center justify-center">
      <LinearGradient
        colors={item.gradient}
        className="w-32 h-32 rounded-full items-center justify-center mb-10"
        style={{ shadowColor: item.gradient[0], shadowOpacity: 0.4, shadowRadius: 20 }}
      >
        <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
      </LinearGradient>

      <Text className="text-3xl font-sora-bold text-background-dark text-center mb-4 leading-tight">
        {item.title}
      </Text>
      <Text className="text-base font-inter text-muted text-center leading-6">
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
          accessibilityLabel="Slajdy onboardingu"
        />
      </View>

      {/* Dots */}
      <View className="flex-row justify-center mb-8 gap-2">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-border'
            }`}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-12 gap-3">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={currentIndex === SLIDES.length - 1 ? 'Zacznij bezpłatnie' : 'Dalej'}
        >
          <LinearGradient
            colors={['#1A56DB', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 rounded-button items-center justify-center"
          >
            <Text className="text-white text-base font-sora-semibold">
              {currentIndex === SLIDES.length - 1 ? 'Zacznij bezpłatnie' : 'Dalej'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          className="h-14 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Mam już konto"
        >
          <Text className="text-primary font-inter-semibold text-base">
            Mam już konto — Zaloguj się
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
