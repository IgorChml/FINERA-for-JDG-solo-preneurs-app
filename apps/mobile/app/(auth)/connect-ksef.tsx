import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { KSeFTokenSchema, type KSeFTokenInput } from '@finera/shared';
import { api } from '../../utils/api';
import FormField from '../../components/forms/FormField';

const KSEF_DEMO_URL = 'https://ksef-demo.mf.gov.pl';

export default function ConnectKSeFScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [environment, setEnvironment] = useState<'DEMO' | 'PRODUCTION'>('DEMO');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<KSeFTokenInput>({
    resolver: zodResolver(KSeFTokenSchema),
    defaultValues: { token: '', environment: 'DEMO' },
  });

  const onSubmit = async (data: KSeFTokenInput) => {
    setIsLoading(true);
    try {
      await api.post('/api/ksef/token', { ...data, environment });
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Nieprawidłowy token KSeF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-14 pb-8">
          <View className="mb-8">
            <View className="w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mb-4">
              <Text style={{ fontSize: 32 }}>🏛️</Text>
            </View>
            <Text className="text-2xl font-sora-bold text-background-dark mb-2">
              Połącz się z KSeF
            </Text>
            <Text className="text-muted font-inter leading-6">
              Krajowy System e-Faktur umożliwia automatyczne pobieranie faktur zakupowych i wysyłkę
              sprzedażowych. Połączenie jest opcjonalne — możesz to zrobić później.
            </Text>
          </View>

          {/* Environment toggle */}
          <View className="mb-6">
            <Text className="text-sm font-inter-semibold text-background-dark mb-2">
              Środowisko
            </Text>
            <View className="flex-row bg-border rounded-button p-1">
              {(['DEMO', 'PRODUCTION'] as const).map((env) => (
                <TouchableOpacity
                  key={env}
                  onPress={() => setEnvironment(env)}
                  className={`flex-1 h-10 rounded-lg items-center justify-center ${
                    environment === env ? 'bg-white' : ''
                  }`}
                  accessibilityRole="radio"
                  accessibilityLabel={`Środowisko ${env}`}
                  accessibilityState={{ selected: environment === env }}
                >
                  <Text
                    className={`text-sm font-inter-semibold ${
                      environment === env ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    {env === 'DEMO' ? 'Demo (testowe)' : 'Produkcja'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-primary-50 rounded-card p-4 mb-6">
            <Text className="text-sm font-inter-semibold text-primary mb-2">
              Jak uzyskać token KSeF?
            </Text>
            <Text className="text-sm font-inter text-primary-600 leading-5">
              1. Zaloguj się do portalu KSeF profilem zaufanym lub e-Dowodem{'\n'}
              2. Przejdź do sekcji "Ustawienia konta"{'\n'}
              3. Wygeneruj token API (Typ: uprawnienia do faktur){'\n'}
              4. Skopiuj token i wklej poniżej
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(KSEF_DEMO_URL)}
              className="mt-3"
              accessibilityRole="link"
              accessibilityLabel="Otwórz portal KSeF"
            >
              <Text className="text-primary font-inter-semibold text-sm underline">
                Otwórz portal KSeF →
              </Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Token KSeF"
                placeholder="Wklej token z portalu KSeF..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.token?.message}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            )}
          />

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Połącz z KSeF"
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 rounded-button items-center justify-center"
              >
                <Text className="text-white text-base font-sora-semibold">
                  {isLoading ? 'Weryfikacja...' : 'Połącz z KSeF'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              className="h-12 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Pomiń, zrobię to później"
            >
              <Text className="text-muted font-inter">Pomiń — zrobię to później</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
