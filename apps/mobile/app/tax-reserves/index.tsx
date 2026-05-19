import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { api } from '../../utils/api';
import { formatPln } from '../../utils/format';
import Card from '../../components/ui/Card';

interface TaxReserveResponse {
  reserve: {
    vatOwed: string;
    pitOwed: string;
    zusHealthOwed: string;
    zusSocialOwed: string;
    totalOwed: string;
    isPaid: boolean;
  };
  calculation: {
    netRevenue: number;
    deductibleCosts: number;
    taxBase: number;
    effectiveTaxRate: number;
  };
}

interface Payment {
  type: string;
  amount: number;
  dueDate: string;
  label: string;
  recipient: string;
  microaccountType: string;
}

interface QrResponse {
  qrDataUrl: string;
}

export default function TaxReservesScreen() {
  const router = useRouter();
  const now = new Date();
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  const reserveQuery = useQuery({
    queryKey: ['tax-reserve-detail', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get<TaxReserveResponse>(
        `/api/tax/reserves/${now.getFullYear()}/${now.getMonth() + 1}`
      ),
  });

  const paymentsQuery = useQuery({
    queryKey: ['upcoming-payments'],
    queryFn: () => api.get<{ payments: Payment[] }>('/api/tax/payments/upcoming'),
  });

  const qrMutation = useMutation({
    mutationFn: (payment: Payment) =>
      api.post<QrResponse>('/api/tax/payments/qr', {
        accountNumber: '12345678901234567890123456',
        amount: payment.amount,
        recipient: payment.recipient,
        title: payment.label,
      }),
    onSuccess: (data) => {
      setSelectedQr(data.qrDataUrl);
    },
  });

  const reserve = reserveQuery.data;
  const payments = paymentsQuery.data?.payments ?? [];

  const monthLabel = format(now, 'LLLL yyyy', { locale: pl });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-2 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text className="text-primary font-inter-semibold text-base">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-sora-bold text-background-dark">
          Rezerwy podatkowe
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="font-inter text-muted text-sm mb-4 capitalize">{monthLabel}</Text>

        {reserveQuery.isLoading ? (
          <ActivityIndicator color="#1A56DB" className="mt-8" />
        ) : reserve ? (
          <>
            {/* Total obligation */}
            <Card className="p-5 mb-4 bg-danger-50 border-danger/20 border">
              <Text className="font-inter text-danger-600 text-sm">Łączne zobowiązania</Text>
              <Text className="font-sora-bold text-danger text-3xl mt-1">
                {formatPln(Number(reserve.reserve.totalOwed))}
              </Text>
              <Text className="font-inter text-muted text-xs mt-2">
                Stopa efektywna: {(reserve.calculation.effectiveTaxRate * 100).toFixed(1)}% przychodów
              </Text>
            </Card>

            {/* Breakdown */}
            <Card className="mb-4 overflow-hidden">
              {[
                { label: 'VAT-7', amount: Number(reserve.reserve.vatOwed), type: 'vat', deadline: '25. dnia miesiąca' },
                { label: 'Zaliczka PIT', amount: Number(reserve.reserve.pitOwed), type: 'pit', deadline: '20. dnia miesiąca' },
                { label: 'ZUS Zdrowotna', amount: Number(reserve.reserve.zusHealthOwed), type: 'zus_health', deadline: '20. dnia miesiąca' },
                { label: 'ZUS Społeczne', amount: Number(reserve.reserve.zusSocialOwed), type: 'zus_social', deadline: '20. dnia miesiąca' },
              ].map((item, i, arr) => (
                <View
                  key={item.type}
                  className={`px-4 py-3.5 flex-row items-center justify-between ${
                    i < arr.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <View>
                    <Text className="font-inter-semibold text-background-dark text-sm">{item.label}</Text>
                    <Text className="font-inter text-muted text-xs">Do: {item.deadline}</Text>
                  </View>
                  <Text className="font-sora-bold text-background-dark text-base">
                    {formatPln(item.amount)}
                  </Text>
                </View>
              ))}
            </Card>

            {/* Base info */}
            <Card className="p-4 mb-6">
              <Text className="font-inter-semibold text-muted text-xs mb-3">PODSTAWA OBLICZENIA</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="font-inter text-muted text-sm">Przychód netto</Text>
                <Text className="font-inter-semibold text-background-dark text-sm">
                  {formatPln(reserve.calculation.netRevenue)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="font-inter text-muted text-sm">Koszty odliczalne</Text>
                <Text className="font-inter-semibold text-background-dark text-sm">
                  -{formatPln(reserve.calculation.deductibleCosts)}
                </Text>
              </View>
              <View className="h-px bg-border my-2" />
              <View className="flex-row justify-between">
                <Text className="font-inter-semibold text-background-dark text-sm">Podstawa opodatkowania</Text>
                <Text className="font-sora-semibold text-primary text-sm">
                  {formatPln(reserve.calculation.taxBase)}
                </Text>
              </View>
            </Card>

            {/* QR Payment section */}
            <Text className="font-sora-semibold text-background-dark text-base mb-3">
              📲 Kody QR do przelewów
            </Text>
            <Text className="font-inter text-muted text-sm mb-4">
              Skanuj aparatem bankowym, aby wykonać przelew bez ręcznego wprowadzania danych
            </Text>

            {payments.map((payment) => (
              <Card key={payment.type} className="mb-3 overflow-hidden">
                <View className="px-4 py-3 flex-row items-center justify-between">
                  <View>
                    <Text className="font-inter-semibold text-background-dark text-sm">{payment.label}</Text>
                    <Text className="font-sora-bold text-background-dark text-base mt-0.5">
                      {formatPln(payment.amount)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => qrMutation.mutate(payment)}
                    disabled={qrMutation.isPending}
                    className="bg-primary-50 px-4 py-2 rounded-button"
                    accessibilityRole="button"
                    accessibilityLabel={`Generuj QR dla ${payment.label}`}
                  >
                    {qrMutation.isPending ? (
                      <ActivityIndicator color="#1A56DB" size="small" />
                    ) : (
                      <Text className="text-primary font-inter-semibold text-sm">QR →</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* QR code display */}
                {selectedQr && (
                  <View className="px-4 pb-4 items-center">
                    <Image
                      source={{ uri: selectedQr }}
                      className="w-48 h-48"
                      accessibilityLabel="Kod QR przelewu"
                      resizeMode="contain"
                    />
                    <Text className="text-xs font-inter text-muted mt-2 text-center">
                      Skanuj kodem bankowym
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </>
        ) : (
          <View className="items-center mt-12">
            <Text style={{ fontSize: 48 }}>📊</Text>
            <Text className="font-sora-semibold text-background-dark text-lg mt-4">
              Brak danych
            </Text>
            <Text className="font-inter text-muted text-center mt-2">
              Dodaj faktury, aby obliczyć rezerwy podatkowe
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
