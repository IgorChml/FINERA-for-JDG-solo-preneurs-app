import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '../../stores/subscription.store';

const BENEFITS = [
  { emoji: '📸', text: 'Nieograniczone skanowanie paragonów' },
  { emoji: '🤖', text: 'Analizy AI Twoich wyników finansowych' },
  { emoji: '📚', text: 'Pełna biblioteka wiedzy (20+ lekcji)' },
  { emoji: '🛡️', text: 'Ocena ryzyka podatkowego każdego wydatku' },
  { emoji: '🔔', text: 'Powiadomienia o zmianach przepisów' },
  { emoji: '⚡', text: 'Priorytetowe aktualizacje nowych funkcji' },
];

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  triggerFeature?: string;
}

export default function Paywall({ visible, onClose, triggerFeature }: PaywallProps) {
  const { purchase, restore } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const success = await purchase();
      if (success) {
        Alert.alert('Dziękujemy!', 'Twój 7-dniowy okres próbny został aktywowany.', [
          { text: 'Zaczynajmy!', onPress: onClose },
        ]);
      }
    } catch {
      Alert.alert('Błąd', 'Nie udało się przetworzyć płatności. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
      Alert.alert('Gotowe', 'Subskrypcja została przywrócona.');
      onClose();
    } catch {
      Alert.alert('Brak subskrypcji', 'Nie znaleziono aktywnej subskrypcji do przywrócenia.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView className="flex-1 bg-background">
        {/* Header */}
        <LinearGradient
          colors={['#1A56DB', '#2563EB']}
          className="pt-14 pb-8 px-6 items-center"
        >
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-14 right-6"
            accessibilityRole="button"
            accessibilityLabel="Zamknij"
          >
            <Text className="text-white/70 font-inter text-base">✕</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 40 }}>✨</Text>
          <Text className="text-white text-2xl font-sora-bold mt-3 text-center">
            Odblokuj pełne możliwości FINERA
          </Text>
          {triggerFeature && (
            <View className="bg-white/20 rounded-full px-4 py-1 mt-3">
              <Text className="text-white text-sm font-inter">
                Potrzebujesz Premium: {triggerFeature}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View className="px-6 py-6">
          {/* Benefits list */}
          <Text className="font-sora-semibold text-background-dark text-base mb-4">
            Co dostajesz w Premium:
          </Text>
          <View className="gap-3 mb-8">
            {BENEFITS.map((b) => (
              <View key={b.text} className="flex-row items-center gap-3">
                <View className="w-9 h-9 bg-success-50 rounded-full items-center justify-center">
                  <Text style={{ fontSize: 18 }}>{b.emoji}</Text>
                </View>
                <Text className="font-inter text-background-dark text-base flex-1">{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Price */}
          <View className="items-center mb-6">
            <Text className="text-4xl font-sora-bold text-background-dark">49 zł</Text>
            <Text className="font-inter text-muted">/ miesiąc</Text>
            <View className="bg-success-50 rounded-full px-4 py-1.5 mt-2">
              <Text className="text-success font-inter-semibold text-sm">
                Zacznij 7-dniowy bezpłatny okres próbny
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Wypróbuj za darmo przez 7 dni"
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
              className="h-14 rounded-button items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-sora-semibold">
                  Wypróbuj za darmo przez 7 dni
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            className="h-12 items-center justify-center mt-2"
            accessibilityRole="button"
            accessibilityLabel="Przywróć subskrypcję"
          >
            <Text className="text-primary font-inter-semibold text-sm">
              {isRestoring ? 'Przywracanie...' : 'Przywróć subskrypcję'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text className="text-center text-xs font-inter text-muted mt-4 leading-4">
            Anuluj kiedy chcesz.{'\n'}Opłata przez App Store / Google Play.
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}
