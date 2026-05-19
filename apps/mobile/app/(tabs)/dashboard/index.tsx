import { useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuthStore } from '../../../stores/auth.store';
import { api } from '../../../utils/api';
import { formatPln } from '../../../utils/format';
import Card from '../../../components/ui/Card';

interface DashboardSummary {
  month: number;
  year: number;
  income: { gross: number; net: number; count: number };
  costs: { gross: number; net: number; count: number };
}

interface TaxReserveData {
  reserve: {
    vatOwed: string;
    pitOwed: string;
    zusHealthOwed: string;
    zusSocialOwed: string;
    totalOwed: string;
  };
  calculation: { effectiveTaxRate: number };
}

interface Payment {
  type: string;
  amount: number;
  dueDate: string;
  label: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const now = new Date();
  const monthLabel = format(now, 'LLLL yyyy', { locale: pl });

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get<{ summary: DashboardSummary }>(
        `/api/invoices/dashboard/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      ),
    staleTime: 1000 * 60 * 5,
  });

  const taxQuery = useQuery({
    queryKey: ['tax-reserve', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get<TaxReserveData>(
        `/api/tax/reserves/${now.getFullYear()}/${now.getMonth() + 1}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const paymentsQuery = useQuery({
    queryKey: ['upcoming-payments'],
    queryFn: () => api.get<{ payments: Payment[] }>('/api/tax/payments/upcoming'),
    staleTime: 1000 * 60 * 15,
  });

  const isRefreshing =
    summaryQuery.isFetching || taxQuery.isFetching || paymentsQuery.isFetching;

  const handleRefresh = useCallback(() => {
    summaryQuery.refetch();
    taxQuery.refetch();
    paymentsQuery.refetch();
  }, []);

  const summary = summaryQuery.data?.summary;
  const tax = taxQuery.data;
  const payments = paymentsQuery.data?.payments ?? [];

  const netProfit = (summary?.income.gross ?? 0) - (summary?.costs.gross ?? 0);
  const totalTax = tax ? Number(tax.reserve.totalOwed) : 0;
  const cleanProfit = netProfit - totalTax;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1A56DB" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-muted font-inter text-sm capitalize">{monthLabel}</Text>
          <Text className="text-2xl font-sora-bold text-background-dark">
            Cześć, {user?.firstName}! 👋
          </Text>
        </View>

        {/* Clean Profit Hero Card */}
        <View className="px-5 mb-4">
          <LinearGradient
            colors={['#1A56DB', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-card p-5"
            style={{ shadowColor: '#1A56DB', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
          >
            <Text className="text-white/70 font-inter text-sm mb-1">Czysty zysk (est.)</Text>
            {summaryQuery.isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-3xl font-sora-bold">
                {formatPln(cleanProfit)}
              </Text>
            )}
            <View className="flex-row gap-4 mt-4">
              <View>
                <Text className="text-white/60 font-inter text-xs">Przychody</Text>
                <Text className="text-white font-sora-semibold text-base">
                  {formatPln(summary?.income.gross ?? 0)}
                </Text>
              </View>
              <View>
                <Text className="text-white/60 font-inter text-xs">Koszty</Text>
                <Text className="text-white font-sora-semibold text-base">
                  {formatPln(summary?.costs.gross ?? 0)}
                </Text>
              </View>
              <View>
                <Text className="text-white/60 font-inter text-xs">Rezerwa VAT+PIT</Text>
                <Text className="text-white font-sora-semibold text-base">
                  {formatPln(totalTax)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-5">
          <Text className="text-sm font-inter-semibold text-muted mb-3">Szybkie akcje</Text>
          <View className="flex-row gap-3">
            {[
              { emoji: '➕', label: 'Nowa faktura', route: '/(tabs)/invoices' },
              { emoji: '📸', label: 'Skanuj koszt', route: '/(tabs)/costs' },
              { emoji: '🏛️', label: 'Sync KSeF', action: 'ksef' },
              { emoji: '🤖', label: 'Zapytaj AI', route: '/(tabs)/chat' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => action.route && router.push(action.route as Parameters<typeof router.push>[0])}
                className="flex-1 bg-surface rounded-card py-3 items-center gap-1 border border-border"
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text style={{ fontSize: 20 }}>{action.emoji}</Text>
                <Text className="text-xs font-inter text-muted text-center">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tax Obligations */}
        {payments.length > 0 && (
          <View className="px-5 mb-5">
            <Text className="text-base font-sora-semibold text-background-dark mb-3">
              💳 Do zapłaty
            </Text>
            <Card className="overflow-hidden">
              {payments.map((payment, index) => (
                <View
                  key={payment.type}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${
                    index < payments.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-inter-semibold text-background-dark text-sm">
                      {payment.label}
                    </Text>
                    <Text className="font-inter text-muted text-xs mt-0.5">
                      Termin: {format(new Date(payment.dueDate), 'dd.MM.yyyy')}
                    </Text>
                  </View>
                  <Text className="font-sora-semibold text-danger text-base">
                    {formatPln(payment.amount)}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                className="bg-primary-50 mx-4 mb-4 mt-2 h-11 rounded-button items-center justify-center"
                onPress={() => router.push('/tax-reserves')}
                accessibilityRole="button"
                accessibilityLabel="Generuj kody QR do przelewów"
              >
                <Text className="text-primary font-inter-semibold text-sm">
                  Generuj kody QR do przelewów →
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Revenue vs Costs mini summary */}
        <View className="px-5 mb-5">
          <Text className="text-base font-sora-semibold text-background-dark mb-3">
            📈 Ten miesiąc
          </Text>
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <Text className="text-xs font-inter text-muted mb-1">Faktury sprzedaży</Text>
              <Text className="text-xl font-sora-bold text-success">
                {formatPln(summary?.income.gross ?? 0)}
              </Text>
              <Text className="text-xs font-inter text-muted mt-1">
                {summary?.income.count ?? 0} faktur
              </Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-xs font-inter text-muted mb-1">Koszty</Text>
              <Text className="text-xl font-sora-bold text-danger">
                {formatPln(summary?.costs.gross ?? 0)}
              </Text>
              <Text className="text-xs font-inter text-muted mt-1">
                {summary?.costs.count ?? 0} faktur
              </Text>
            </Card>
          </View>
        </View>

        {/* Effective tax rate */}
        {tax && (
          <View className="px-5 mb-8">
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-inter-semibold text-background-dark text-sm">
                  Efektywna stopa podatkowa
                </Text>
                <Text className="font-sora-bold text-warning text-lg">
                  {(tax.calculation.effectiveTaxRate * 100).toFixed(1)}%
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-warning rounded-full"
                  style={{ width: `${Math.min(tax.calculation.effectiveTaxRate * 100, 100)}%` }}
                />
              </View>
              <Text className="text-xs font-inter text-muted mt-2">
                VAT: {formatPln(Number(tax.reserve.vatOwed))} · PIT: {formatPln(Number(tax.reserve.pitOwed))} · ZUS: {formatPln(Number(tax.reserve.zusHealthOwed) + Number(tax.reserve.zusSocialOwed))}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
