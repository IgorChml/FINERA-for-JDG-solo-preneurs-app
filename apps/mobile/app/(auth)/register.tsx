import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { RegisterSchema, type RegisterInput } from '@finera/shared';
import { api } from '../../utils/api';
import FormField from '../../components/forms/FormField';

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/register', data, { skipAuth: true } as Parameters<typeof api.post>[2]);

      Alert.alert(
        'Konto utworzone! 🎉',
        'Sprawdź swoją skrzynkę email, aby potwierdzić konto, a następnie zaloguj się.',
        [{ text: 'Zaloguj się', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert(
        'Błąd rejestracji',
        error instanceof Error ? error.message : 'Spróbuj ponownie'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8"
            accessibilityRole="button"
            accessibilityLabel="Wróć"
          >
            <Text className="text-primary font-inter-semibold text-base">← Wróć</Text>
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-3xl font-sora-bold text-background-dark mb-2">
              Stwórz konto
            </Text>
            <Text className="text-muted font-inter text-base">
              Bezpłatnie, bez karty kredytowej
            </Text>
          </View>

          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Imię"
                      placeholder="Jan"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                      autoComplete="given-name"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Nazwisko"
                      placeholder="Kowalski"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                      autoComplete="family-name"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Adres email"
                  placeholder="jan@kowalski.pl"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Hasło"
                  placeholder="Min. 8 znaków, wielka litera i cyfra"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
            />
          </View>

          <Text className="text-xs text-muted font-inter mt-4 text-center">
            Rejestrując się, akceptujesz{' '}
            <Text className="text-primary">Regulamin</Text> i{' '}
            <Text className="text-primary">Politykę Prywatności (RODO)</Text>
          </Text>

          <View className="mt-6">
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Stwórz konto"
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 rounded-button items-center justify-center"
              >
                <Text className="text-white text-base font-sora-semibold">
                  {isLoading ? 'Tworzenie konta...' : 'Stwórz bezpłatne konto'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted font-inter">Masz już konto? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Zaloguj się"
            >
              <Text className="text-primary font-inter-semibold">Zaloguj się</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
