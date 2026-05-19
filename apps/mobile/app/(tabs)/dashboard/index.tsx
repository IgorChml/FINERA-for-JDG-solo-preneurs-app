import { useCallback, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuthStore } from '../../../stores/auth.store';
import { useSubscriptionStore } from '../../../stores/subscription.store';
import { api } from '../../../utils/api';
import { formatPln } from '../../../utils/format';
import Card from '../../../components/ui/Card';
import Paywall from '../../../components/ui/Paywall';

type PeriodKey = 'monthly' | 'quarterly' | 'yearly';
const PERIOD_OPTIONS: { key: PeriodKey; label: string; period: () => string }[] = [
  {
    key: 'monthly',
    label: 'Ten miesiąc',
    period: () => format(new Date(), 'yyyy-MM'),
  },
  {
    key: 'quarterly',
    label: 'Ten kwartał',
    period: () => {
      const m = new Date().getMonth() + 1;
      return `${new Date().getFullYear()}-Q${Math.ceil(m / 3)}`;
    },
  },
  {
    key: 'yearly',
    label: 'Ten rok',
    period: () => String(new Date().getFullYear()),
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { canUseInsightEngine } = useSubscriptionStore();
  const now = new Date();
  const monthLabel = format(now, 'LLLL yyyy', { locale: pl });

  const [activePeriod, setActivePeriod] = useState<PeriodKey>('monthly');
  const [showPaywall, setShowPaywall] = useState(false);

  const periodDef = PERIOD_OPTIONS.find((p) => p.key === activePeriod)!;

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get<{ summary: { income: { gross: number; count: number }; costs: { gross: number; count: number } } }>(
        `/api/invoices/dashboard/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      ),
  });

  const taxQuery = useQuery({
    queryKey: ['tax-reserve', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get<{ reserve: { totalOwed: string; vatOwed: string; pitOwed: string; zusHealthOwed: string; zusSocialOwed: string }; calculation: { effectiveTaxRate: number } }>(
        `/api/tax/reserves/${now.getFullYear()}/${now.getMonth() + 1}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const insightQuery = useQuery({
    queryKey: ['insight', activePeriod, periodDef.period()],
    queryFn: () =>
      api.get<{ report: { narrative: string; metrics: { revenueTotal: number; revenueGrowthPct: number | null; costsTotal: number; grossMarginPct: number }; isCached: boolean } }>(
        `/api/insights/${activePeriod}/${periodDef.period()}`
      ),
    enabled: canUseInsightEngine,
    retry: false,
    staleTime: 1000 * 60 * 60,
  });

  const ratingMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: 1 | -1 }) =>
      api.post(`/api/insights/${id}/rating`, { rating }),
  });

  const paymentsQuery = useQuery({
    queryKey: ['upcoming-payments'],
    queryFn: () => api.get<{ payments: Array<{ type: string; amount: number; dueDate: string; label: string }> }>('/api/tax/payments/upcoming'),
    staleTime: 1000 * 60 * 15,
  });

  const handleRefresh = useCallback(() => {
    summaryQuery.refetch();
    taxQuery.refetch();
    paymentsQuery.refetch();
    if (canUseInsightEngine) insightQuery.refetch();
  }, [canUseInsightEngine]);

  const isRefreshing = summaryQuery.isFetching || taxQuery.isFetching;
  const summary = summaryQuery.data?.summary;
  const tax = taxQuery.data;
  const payments = paymentsQuery.data?.payments ?? [];
  const insight = insightQuery.data?.report;

  const netProfit = (summary?.income.gross ?? 0) - (summary?.costs.gross ?? 0);
  const totalTax = tax ? Number(tax.reserve.totalOwed) : 0;
  const cleanProfit = netProfit - totalTax;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1A56DB" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-muted font-inter text-sm capitalize">{monthLabel}</Text>
          <Text className="text-2xl font-sora-bold text-background-dark">Cześć, {user?.firstName}! 👋</Text>
        </View>

        {/* Hero card */}
        <View className="px-5 mb-4">
          <LinearGradient
            colors={['#1A56DB', '#2563EB']}
            className="rounded-card p-5"
            style={{ shadowColor: '#1A56DB', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
          >
            <Text className="text-white/70 font-inter text-sm mb-1">Czysty zysk (est.)</Text>
            {summaryQuery.isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-3xl font-sora-bold">{formatPln(cleanProfit)}</Text>
            )}
            <View className="flex-row gap-4 mt-4">
              <View>
                <Text className="text-white/60 font-inter text-xs">Przychody</Text>
                <Text className="text-white font-sora-semibold text-base">{formatPln(summary?.income.gross ?? 0)}</Text>
              </View>
              <View>
                <Text className="text-white/60 font-inter text-xs">Koszty</Text>
                <Text className="text-white font-sora-semibold text-base">{formatPln(summary?.costs.gross ?? 0)}</Text>
              </View>
              <View>
                <Text className="text-white/60 font-inter text-xs">Rezerwa</Text>
                <Text className="text-white font-sora-semibold text-base">{formatPln(totalTax)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View className="px-5 mb-5">
          <View className="flex-row gap-3">
            {[
              { emoji: '➕', label: 'Nowa faktura', route: '/(tabs)/invoices' },
              { emoji: '📸', label: 'Skanuj koszt', route: '/(tabs)/costs' },
              { emoji: '📚', label: 'Wiedza', route: '/(tabs)/learn' },
              { emoji: '🏛️', label: 'KSeF sync', route: null },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => a.route && router.push(a.route as Parameters<typeof router.push>[0])}
                className="flex-1 bg-surface rounded-card py-3 items-center gap-1 border border-border"
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <Text style={{ fontSize: 20 }}>{a.emoji}</Text>
                <Text className="text-xs font-inter text-muted text-center">{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payments */}
        {payments.length > 0 && (
          <View className="px-5 mb-5">
            <Text className="text-base font-sora-semibold text-background-dark mb-3">💳 Do zapłaty</Text>
            <Card className="overflow-hidden">
              {payments.map((p, i) => (
                <View key={p.type} className={`flex-row items-center justify-between px-4 py-3.5 ${i < payments.length - 1 ? 'border-b border-border' : ''}`}>
                  <View>
                    <Text className="font-inter-semibold text-background-dark text-sm">{p.label}</Text>
                    <Text className="font-inter text-muted text-xs mt-0.5">
                      Termin: {format(new Date(p.dueDate), 'dd.MM.yyyy')}
                    </Text>
                  </View>
                  <Text className="font-sora-semibold text-danger text-base">{formatPln(p.amount)}</Text>
                </View>
              ))}
              <TouchableOpacity
                className="bg-primary-50 mx-4 mb-4 mt-2 h-11 rounded-button items-center justify-center"
                onPress={() => router.push('/tax-reserves')}
                accessibilityRole="button"
                accessibilityLabel="Generuj kody QR"
              >
                <Text className="text-primary font-inter-semibold text-sm">Generuj kody QR do przelewów →</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* ── AI INSIGHT ENGINE ────────────────────────── */}
        <View className="px-5 mb-5">
          <Text className="text-base font-sora-semibold text-background-dark mb-3">✨ Twoje wyniki</Text>

          {/* Period picker */}
          <View className="flex-row bg-border rounded-button p-1 mb-4">
            {PERIOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  if (!canUseInsightEngine) { setShowPaywall(true); return; }
                  setActivePeriod(opt.key);
                }}
                className={`flex-1 h-9 rounded-lg items-center justify-center ${activePeriod === opt.key ? 'bg-white' : ''}`}
                accessibilityRole="tab"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: activePeriod === opt.key }}
              >
                <Text className={`text-xs font-inter-semibold ${activePeriod === opt.key ? 'text-primary' : 'text-muted'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Metrics tiles */}
          {insight && (
            <View className="flex-row flex-wrap gap-3 mb-4">
              {[
                { label: 'Przychody', value: formatPln(insight.metrics.revenueTotal), color: 'text-success' },
                {
                  label: 'Zmiana',
                  value: insight.metrics.revenueGrowthPct !== null
                    ? `${insight.metrics.revenueGrowthPct > 0 ? '+' : ''}${insight.metrics.revenueGrowthPct.toFixed(1)}%`
                    : '—',
                  color: (insight.metrics.revenueGrowthPct ?? 0) >= 0 ? 'text-success' : 'text-danger',
                },
                { label: 'Koszty', value: formatPln(insight.metrics.costsTotal), color: 'text-danger' },
                { label: 'Marża', value: `${insight.metrics.grossMarginPct.toFixed(1)}%`, color: 'text-primary' },
              ].map((tile) => (
                <Card key={tile.label} className="flex-1 p-3" style={{ minWidth: '45%' }}>
                  <Text className="text-xs font-inter text-muted mb-1">{tile.label}</Text>
                  <Text className={`font-sora-bold text-base ${tile.color}`}>{tile.value}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Narrative */}
          <Card className="p-4">
            {!canUseInsightEngine ? (
              <TouchableOpacity onPress={() => setShowPaywall(true)} accessibilityRole="button">
                <View className="items-center py-2">
                  <Text style={{ fontSize: 32 }}>🔒</Text>
                  <Text className="font-sora-semibold text-background-dark text-base mt-2 text-center">
                    Analiza AI — funkcja Premium
                  </Text>
                  <Text className="font-inter text-muted text-sm text-center mt-1">
                    Wypróbuj 7 dni za darmo
                  </Text>
                  <View className="bg-primary-50 px-5 h-10 rounded-button items-center justify-center mt-3">
                    <Text className="text-primary font-inter-semibold text-sm">Odblokuj →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : insightQuery.isLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#1A56DB" />
                <Text className="font-inter text-muted text-sm mt-2">Generuję analizę...</Text>
              </View>
            ) : insight ? (
              <>
                <View className="flex-row items-center gap-2 mb-3">
                  <Text style={{ fontSize: 18 }}>✨</Text>
                  <Text className="font-inter-semibold text-background-dark text-sm">Analiza AI</Text>
                  {insight.isCached && (
                    <View className="bg-border px-2 py-0.5 rounded-full">
                      <Text className="text-muted text-xs font-inter">z cache</Text>
                    </View>
                  )}
                </View>
                <Text className="font-inter text-background-dark leading-6 text-sm">{insight.narrative}</Text>
                <View className="flex-row gap-3 mt-4 pt-3 border-t border-border">
                  <TouchableOpacity
                    onPress={() => ratingMutation.mutate({ id: '', rating: 1 })}
                    className="flex-row items-center gap-1"
                    accessibilityRole="button"
                    accessibilityLabel="Pomocne"
                  >
                    <Text>👍</Text>
                    <Text className="text-muted text-xs font-inter">Pomocne</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => ratingMutation.mutate({ id: '', rating: -1 })}
                    className="flex-row items-center gap-1"
                    accessibilityRole="button"
                    accessibilityLabel="Niepomocne"
                  >
                    <Text>👎</Text>
                    <Text className="text-muted text-xs font-inter">Niepomocne</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-muted text-xs font-inter mt-2">
                  Analiza na podstawie Twoich danych · Odświeżana co 24h
                </Text>
              </>
            ) : (
              <View className="items-center py-4">
                <Text style={{ fontSize: 32 }}>📊</Text>
                <Text className="font-sora-semibold text-background-dark text-base mt-2 text-center">
                  Za mało danych do analizy
                </Text>
                <Text className="font-inter text-muted text-sm text-center mt-1">
                  Dodaj faktury za ten okres
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} triggerFeature="AI Insight Engine" />
    </SafeAreaView>
  );
}
