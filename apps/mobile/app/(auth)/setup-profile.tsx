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
import { JDGProfileSchema, type JDGProfileInput, TAX_FORM_LABELS } from '@finera/shared';
import { api } from '../../utils/api';
import FormField from '../../components/forms/FormField';
import SelectField from '../../components/forms/SelectField';

const TAX_FORM_OPTIONS = [
  { label: 'Skala podatkowa (12%/32%)', value: 'SCALE' },
  { label: 'Podatek liniowy (19%)', value: 'LINEAR' },
  { label: 'Ryczałt', value: 'LUMP_SUM' },
] as const;

const VAT_RATE_OPTIONS = [
  { label: '23% — Stawka podstawowa', value: '23' },
  { label: '8% — Usługi budowlane, gastro', value: '8' },
  { label: '5% — Żywność, książki', value: '5' },
  { label: '0% — Eksport, zwolnienie', value: '0' },
] as const;

type StepKey = 'company' | 'tax' | 'address';

export default function SetupProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<StepKey>('company');

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<JDGProfileInput>({
    resolver: zodResolver(JDGProfileSchema),
    defaultValues: {
      companyName: '',
      nip: '',
      taxForm: 'SCALE',
      vatRate: 23,
      isVatPayer: true,
      address: { street: '', houseNumber: '', postalCode: '', city: '', country: 'PL' },
    },
  });

  const taxForm = watch('taxForm');

  const steps: StepKey[] = ['company', 'tax', 'address'];
  const stepIndex = steps.indexOf(step);
  const stepLabels: Record<StepKey, string> = {
    company: 'Dane firmy',
    tax: 'Forma opodatkowania',
    address: 'Adres',
  };

  const handleNext = async () => {
    const fieldsMap: Record<StepKey, (keyof JDGProfileInput)[]> = {
      company: ['companyName', 'nip'],
      tax: ['taxForm', 'vatRate', 'isVatPayer'],
      address: ['address'],
    };

    const valid = await trigger(fieldsMap[step]);
    if (!valid) return;

    if (stepIndex < steps.length - 1) {
      setStep(steps[stepIndex + 1]);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (data: JDGProfileInput) => {
    setIsLoading(true);
    try {
      await api.post('/api/profile', data);
      router.replace('/(auth)/connect-ksef');
    } catch (error) {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Spróbuj ponownie');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Progress bar */}
      <View className="bg-surface pt-14 px-6 pb-4">
        <Text className="text-xs text-muted font-inter mb-2">
          Krok {stepIndex + 1} z {steps.length} — {stepLabels[step]}
        </Text>
        <View className="h-1.5 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-6 pb-8">
          {step === 'company' && (
            <View className="gap-4">
              <View className="mb-4">
                <Text className="text-2xl font-sora-bold text-background-dark mb-1">
                  Dane Twojej firmy
                </Text>
                <Text className="text-muted font-inter">
                  Podaj dane swojej Jednoosobowej Działalności Gospodarczej
                </Text>
              </View>

              <Controller
                control={control}
                name="companyName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Nazwa firmy"
                    placeholder="Jan Kowalski IT"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.companyName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="nip"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="NIP (10 cyfr)"
                    placeholder="1234567890"
                    value={value}
                    onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
                    onBlur={onBlur}
                    error={errors.nip?.message}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                )}
              />

              <Controller
                control={control}
                name="regon"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="REGON (opcjonalnie)"
                    placeholder="123456789"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.regon?.message}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          )}

          {step === 'tax' && (
            <View className="gap-4">
              <View className="mb-4">
                <Text className="text-2xl font-sora-bold text-background-dark mb-1">
                  Forma opodatkowania
                </Text>
                <Text className="text-muted font-inter">
                  Na tej podstawie FINERA oblicza Twoje podatki
                </Text>
              </View>

              <Controller
                control={control}
                name="taxForm"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    label="Forma opodatkowania"
                    options={TAX_FORM_OPTIONS}
                    value={value}
                    onChange={onChange}
                    error={errors.taxForm?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="isVatPayer"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Text className="text-sm font-inter-semibold text-background-dark mb-2">
                      Czy jesteś płatnikiem VAT?
                    </Text>
                    <View className="flex-row gap-3">
                      {[
                        { label: 'Tak', value: true },
                        { label: 'Nie', value: false },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={String(opt.value)}
                          onPress={() => onChange(opt.value)}
                          className={`flex-1 h-12 rounded-button items-center justify-center border-2 ${
                            value === opt.value
                              ? 'border-primary bg-primary-50'
                              : 'border-border bg-surface'
                          }`}
                          accessibilityRole="radio"
                          accessibilityLabel={opt.label}
                          accessibilityState={{ selected: value === opt.value }}
                        >
                          <Text
                            className={`font-inter-semibold ${
                              value === opt.value ? 'text-primary' : 'text-muted'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="vatRate"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    label="Stawka VAT"
                    options={VAT_RATE_OPTIONS}
                    value={String(value)}
                    onChange={(v) => onChange(parseInt(v, 10))}
                    error={errors.vatRate?.message}
                  />
                )}
              />
            </View>
          )}

          {step === 'address' && (
            <View className="gap-4">
              <View className="mb-4">
                <Text className="text-2xl font-sora-bold text-background-dark mb-1">
                  Adres firmy
                </Text>
                <Text className="text-muted font-inter">
                  Adres widoczny na fakturach
                </Text>
              </View>

              <Controller
                control={control}
                name="address.street"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Ulica"
                    placeholder="ul. Marszałkowska"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.address?.street?.message}
                  />
                )}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="address.houseNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        label="Numer"
                        placeholder="10"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.address?.houseNumber?.message}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="address.apartmentNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        label="Lokal (opcj.)"
                        placeholder="5"
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-28">
                  <Controller
                    control={control}
                    name="address.postalCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        label="Kod pocztowy"
                        placeholder="00-001"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.address?.postalCode?.message}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="address.city"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormField
                        label="Miasto"
                        placeholder="Warszawa"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.address?.city?.message}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          )}

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={stepIndex === steps.length - 1 ? 'Zapisz profil' : 'Dalej'}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 rounded-button items-center justify-center"
              >
                <Text className="text-white text-base font-sora-semibold">
                  {isLoading ? 'Zapisywanie...' : stepIndex === steps.length - 1 ? 'Zapisz i kontynuuj' : 'Dalej'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {stepIndex > 0 && (
              <TouchableOpacity
                onPress={() => setStep(steps[stepIndex - 1])}
                className="h-12 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Wróć do poprzedniego kroku"
              >
                <Text className="text-muted font-inter">Wróć</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
