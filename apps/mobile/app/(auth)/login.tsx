import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginSchema, type LoginInput } from '@finera/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useSubscriptionStore } from '../../stores/subscription.store';
import { api } from '../../utils/api';
import FormField from '../../components/forms/FormField';

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  subscription?: { plan: 'FREE' | 'PREMIUM'; status: string; currentPeriodEnd: string };
}

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setPlan } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', data, {
        skipAuth: true,
      } as Parameters<typeof api.post>[2]);

      await setAuth(response.accessToken, {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        emailVerified: response.user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (response.subscription) {
        setPlan(
          response.subscription.plan.toLowerCase() as 'free' | 'premium',
          response.subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled',
          new Date(response.subscription.currentPeriodEnd)
        );
      }

      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert(
        'Błąd logowania',
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
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8"
            accessibilityRole="button"
            accessibilityLabel="Wróć"
          >
            <Text className="text-primary font-inter-semibold text-base">← Wróć</Text>
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-3xl font-sora-bold text-background-dark mb-2">
              Zaloguj się
            </Text>
            <Text className="text-muted font-inter text-base">
              Witaj z powrotem w FINERA
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
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
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
            />

            <TouchableOpacity
              className="self-end"
              accessibilityRole="button"
              accessibilityLabel="Zapomniałem hasła"
            >
              <Text className="text-primary font-inter-semibold text-sm">
                Zapomniałem hasła
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Zaloguj się"
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 rounded-button items-center justify-center"
              >
                <Text className="text-white text-base font-sora-semibold">
                  {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted font-inter">Nie masz konta? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
              accessibilityLabel="Zarejestruj się"
            >
              <Text className="text-primary font-inter-semibold">Zarejestruj się</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
