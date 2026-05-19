import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateInvoiceSchema, type CreateInvoiceInput } from '@finera/shared';
import { api } from '../../../utils/api';
import FormField from '../../../components/forms/FormField';
import SelectField from '../../../components/forms/SelectField';

const VAT_OPTIONS = [
  { label: '23%', value: '23' },
  { label: '8%', value: '8' },
  { label: '5%', value: '5' },
  { label: '0%', value: '0' },
];

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: {
      type: 'INCOME',
      buyerName: '',
      buyerNip: '',
      buyerAddress: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: [{ name: '', quantity: 1, unitPrice: 0, vatRate: 23, unit: 'szt' }],
      currency: 'PLN',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => api.post('/api/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert('Faktura wystawiona! 🎉', 'Faktura została zapisana i wysłana do KSeF.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Spróbuj ponownie');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between bg-surface border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Anuluj"
          >
            <Text className="text-muted font-inter-semibold">Anuluj</Text>
          </TouchableOpacity>
          <Text className="font-sora-bold text-background-dark text-lg">Nowa faktura</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {/* Buyer */}
          <Text className="font-sora-semibold text-background-dark text-base mb-4">
            Dane nabywcy
          </Text>
          <View className="gap-4 mb-6">
            <Controller
              control={control}
              name="buyerName"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Nazwa nabywcy *"
                  placeholder="Acme Sp. z o.o."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.buyerName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="buyerNip"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="NIP nabywcy"
                  placeholder="1234567890"
                  value={value ?? ''}
                  onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
                  onBlur={onBlur}
                  error={errors.buyerNip?.message}
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            />
            <Controller
              control={control}
              name="buyerAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Adres nabywcy"
                  placeholder="ul. Główna 1, 00-001 Warszawa"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Items */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-sora-semibold text-background-dark text-base">
              Pozycje faktury
            </Text>
            <TouchableOpacity
              onPress={() => append({ name: '', quantity: 1, unitPrice: 0, vatRate: 23, unit: 'szt' })}
              accessibilityRole="button"
              accessibilityLabel="Dodaj pozycję"
            >
              <Text className="text-primary font-inter-semibold text-sm">+ Dodaj pozycję</Text>
            </TouchableOpacity>
          </View>

          {fields.map((field, index) => (
            <View key={field.id} className="bg-surface rounded-card p-4 mb-3 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-inter-semibold text-background-dark text-sm">
                  Pozycja {index + 1}
                </Text>
                {fields.length > 1 && (
                  <TouchableOpacity
                    onPress={() => remove(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Usuń pozycję ${index + 1}`}
                  >
                    <Text className="text-danger text-sm">Usuń</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="gap-3">
                <Controller
                  control={control}
                  name={`items.${index}.name`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Nazwa usługi/towaru *"
                      placeholder="Usługi programistyczne"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.items?.[index]?.name?.message}
                    />
                  )}
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <FormField
                          label="Ilość"
                          placeholder="1"
                          value={String(value)}
                          onChangeText={(v) => onChange(parseFloat(v) || 0)}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <FormField
                          label="Cena netto (PLN)"
                          placeholder="1000"
                          value={String(value)}
                          onChangeText={(v) => onChange(parseFloat(v) || 0)}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={control}
                  name={`items.${index}.vatRate`}
                  render={({ field: { onChange, value } }) => (
                    <SelectField
                      label="Stawka VAT"
                      options={VAT_OPTIONS}
                      value={String(value)}
                      onChange={(v) => onChange(parseInt(v, 10))}
                    />
                  )}
                />
              </View>
            </View>
          ))}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit((data) => createMutation.mutate(data))}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
            className="mb-12 mt-4"
            accessibilityRole="button"
            accessibilityLabel="Wystaw fakturę"
          >
            <LinearGradient
              colors={createMutation.isPending ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 rounded-button items-center justify-center"
            >
              <Text className="text-white text-base font-sora-semibold">
                {createMutation.isPending ? 'Wysyłanie...' : 'Wystaw fakturę →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
