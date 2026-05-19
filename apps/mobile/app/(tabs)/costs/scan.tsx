import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../utils/api';
import { useSubscriptionStore } from '../../../stores/subscription.store';
import FormField from '../../../components/forms/FormField';
import SelectField from '../../../components/forms/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import { COST_CATEGORY_LABELS } from '@finera/shared';
import type { OcrResult, AiAuditResult, CreateCostInput } from '@finera/shared';

const CATEGORY_OPTIONS = Object.entries(COST_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type Stage = 'camera' | 'review' | 'audit';

export default function ScanReceiptScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canAccess } = useSubscriptionStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('camera');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [auditResult, setAuditResult] = useState<AiAuditResult | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCostInput>>({
    currency: 'PLN',
  });

  const ocrMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const result = await api.post<{ ocr: OcrResult; audit: AiAuditResult }>('/api/costs/scan', {
        imageBase64,
        imageType: 'jpeg',
      });
      return result;
    },
    onSuccess: (data) => {
      setOcrResult(data.ocr);
      setAuditResult(data.audit);
      setFormData({
        vendor: data.ocr.vendor ?? '',
        vendorNip: data.ocr.vendorNip,
        amount: data.ocr.amount,
        date: data.ocr.date ?? new Date(),
        category: data.ocr.category,
        currency: 'PLN',
      });
      setStage('review');
    },
    onError: (err) => {
      Alert.alert('Błąd skanowania', err instanceof Error ? err.message : 'Spróbuj ponownie');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post('/api/costs', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert('Koszt zapisany! ✅', 'Paragon został przeanalizowany i zapisany.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
  });

  if (!canAccess('ocr_scanner')) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text className="font-sora-bold text-background-dark text-xl text-center mt-4">
          Funkcja Premium
        </Text>
        <Text className="font-inter text-muted text-center mt-2 leading-5">
          Skaner paragonów z AI Pre-Audytem jest dostępny w planie Premium
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6"
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text className="text-primary font-inter-semibold">Wróć</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text style={{ fontSize: 48 }}>📷</Text>
        <Text className="font-sora-bold text-background-dark text-xl text-center mt-4">
          Brak dostępu do aparatu
        </Text>
        <Text className="font-inter text-muted text-center mt-2">
          FINERA potrzebuje dostępu do aparatu aby skanować paragony
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="mt-6"
          accessibilityRole="button"
          accessibilityLabel="Udziel dostępu do aparatu"
        >
          <LinearGradient
            colors={['#1A56DB', '#2563EB']}
            className="px-8 h-12 rounded-button items-center justify-center"
          >
            <Text className="text-white font-sora-semibold">Udziel dostępu</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      // Pre-process: straighten + compress
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!processed.base64) {
        Alert.alert('Błąd', 'Nie udało się przetworzyć zdjęcia');
        return;
      }

      ocrMutation.mutate(processed.base64);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zrobić zdjęcia');
    }
  };

  if (stage === 'camera') {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} className="flex-1" facing="back">
          {/* Overlay guideline */}
          <View className="flex-1 items-center justify-center">
            <View className="w-72 h-96 border-2 border-white/60 rounded-2xl">
              <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
            </View>
            <Text className="text-white/80 font-inter text-sm mt-4">
              Umieść paragon w ramce
            </Text>
          </View>
        </CameraView>

        {/* Bottom controls */}
        <View className="bg-black pb-10 pt-4 px-8 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-14 h-14 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Anuluj"
          >
            <Text className="text-white font-inter text-sm">Anuluj</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCapture}
            disabled={ocrMutation.isPending}
            className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Zrób zdjęcie"
          >
            {ocrMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-white" />
            )}
          </TouchableOpacity>

          <View className="w-14" />
        </View>
      </View>
    );
  }

  if (stage === 'review') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setStage('camera')}
            accessibilityRole="button"
            accessibilityLabel="Skanuj ponownie"
          >
            <Text className="text-primary font-inter-semibold">↺ Skanuj ponownie</Text>
          </TouchableOpacity>
          <Text className="font-sora-bold text-background-dark text-lg">Sprawdź dane</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          {/* AI Audit result */}
          {auditResult && (
            <View className={`rounded-card p-4 mb-5 ${
              auditResult.riskLevel === 'GREEN' ? 'bg-success-50' :
              auditResult.riskLevel === 'YELLOW' ? 'bg-warning-50' : 'bg-danger-50'
            }`}>
              <View className="flex-row items-center gap-2 mb-2">
                <StatusBadge variant={auditResult.riskLevel as 'GREEN' | 'YELLOW' | 'RED'} />
                <Text className="font-sora-semibold text-background-dark text-sm">
                  Ocena AI Pre-Audytu
                </Text>
              </View>
              <Text className="font-inter text-background-dark text-sm leading-5">
                {auditResult.reason}
              </Text>
              <Text className="font-inter text-muted text-xs mt-2">
                Podstawa prawna: {auditResult.legalBasis}
              </Text>
              <Text className="font-inter text-xs mt-1 italic text-muted">
                ⚠️ Podpowiedź AI — nie stanowi porady podatkowej
              </Text>
            </View>
          )}

          <View className="gap-4">
            <FormField
              label="Sprzedawca *"
              value={formData.vendor ?? ''}
              onChangeText={(v) => setFormData((d) => ({ ...d, vendor: v }))}
              placeholder="Nazwa sprzedawcy"
            />

            <FormField
              label="Kwota brutto (PLN) *"
              value={String(formData.amount ?? '')}
              onChangeText={(v) => setFormData((d) => ({ ...d, amount: parseFloat(v) || undefined }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <SelectField
              label="Kategoria kosztu"
              options={CATEGORY_OPTIONS}
              value={formData.category ?? 'OTHER'}
              onChange={(v) => setFormData((d) => ({ ...d, category: v as CreateCostInput['category'] }))}
            />
          </View>

          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="mt-8 mb-12"
            accessibilityRole="button"
            accessibilityLabel="Zapisz koszt"
          >
            <LinearGradient
              colors={saveMutation.isPending ? ['#9CA3AF', '#9CA3AF'] : ['#0E9F6E', '#059669']}
              className="h-14 rounded-button items-center justify-center"
            >
              <Text className="text-white text-base font-sora-semibold">
                {saveMutation.isPending ? 'Zapisywanie...' : '✓ Zapisz koszt'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}
