import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../utils/api';
import { formatPln, formatDate } from '../../../utils/format';
import StatusBadge from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import type { Invoice, InvoiceStatus } from '@finera/shared';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get<{ invoice: Invoice }>(`/api/invoices/${id}`),
    enabled: !!id,
  });

  const markPaidMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/invoices/${id}/status`, {
        status: 'PAID',
        paymentDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });

  const invoice = data?.invoice;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#1A56DB" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="font-sora-semibold text-background-dark text-lg text-center">
          Faktura nie znaleziona
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-inter-semibold">← Wróć</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIncome = invoice.type === 'INCOME';
  const canMarkPaid = invoice.status === 'SENT' || invoice.status === 'OVERDUE';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text className="text-primary font-inter-semibold text-base">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-sora-bold text-background-dark" numberOfLines={1}>
          {invoice.invoiceNumber}
        </Text>
        <StatusBadge variant={invoice.status as InvoiceStatus} />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Amount card */}
        <LinearGradient
          colors={isIncome ? ['#0E9F6E', '#059669'] : ['#E02424', '#C11A1A']}
          className="rounded-card p-5 mb-4"
        >
          <Text className="text-white/70 text-sm font-inter">
            {isIncome ? 'Przychód brutto' : 'Koszt brutto'}
          </Text>
          <Text className="text-white text-3xl font-sora-bold mt-1">
            {isIncome ? '+' : '-'}{formatPln(Number(invoice.grossAmount))}
          </Text>
          <View className="flex-row gap-4 mt-3">
            <View>
              <Text className="text-white/60 text-xs font-inter">Netto</Text>
              <Text className="text-white font-sora-semibold">{formatPln(Number(invoice.netAmount))}</Text>
            </View>
            <View>
              <Text className="text-white/60 text-xs font-inter">VAT</Text>
              <Text className="text-white font-sora-semibold">{formatPln(Number(invoice.vatAmount))}</Text>
            </View>
            <View>
              <Text className="text-white/60 text-xs font-inter">Waluta</Text>
              <Text className="text-white font-sora-semibold">{invoice.currency}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Parties */}
        <Card className="p-4 mb-4">
          <Text className="font-inter-semibold text-muted text-xs mb-3">STRONY FAKTURY</Text>
          <View className="mb-3">
            <Text className="text-xs font-inter text-muted mb-0.5">Sprzedawca</Text>
            <Text className="font-inter-semibold text-background-dark">{invoice.sellerName}</Text>
            <Text className="font-inter text-muted text-sm">NIP: {invoice.sellerNip}</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View>
            <Text className="text-xs font-inter text-muted mb-0.5">Nabywca</Text>
            <Text className="font-inter-semibold text-background-dark">{invoice.buyerName}</Text>
            {invoice.buyerNip && (
              <Text className="font-inter text-muted text-sm">NIP: {invoice.buyerNip}</Text>
            )}
          </View>
        </Card>

        {/* Dates */}
        <Card className="p-4 mb-4">
          <Text className="font-inter-semibold text-muted text-xs mb-3">DATY</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs font-inter text-muted">Data wystawienia</Text>
              <Text className="font-inter-semibold text-background-dark">{formatDate(invoice.issueDate)}</Text>
            </View>
            <View>
              <Text className="text-xs font-inter text-muted">Termin płatności</Text>
              <Text className="font-inter-semibold text-background-dark">{formatDate(invoice.dueDate)}</Text>
            </View>
            {invoice.paymentDate && (
              <View>
                <Text className="text-xs font-inter text-muted">Data płatności</Text>
                <Text className="font-inter-semibold text-success">{formatDate(invoice.paymentDate)}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Items */}
        {invoice.items && invoice.items.length > 0 && (
          <Card className="p-4 mb-4">
            <Text className="font-inter-semibold text-muted text-xs mb-3">POZYCJE</Text>
            {invoice.items.map((item, i) => (
              <View key={item.id ?? i} className={i > 0 ? 'pt-3 border-t border-border mt-3' : ''}>
                <View className="flex-row justify-between">
                  <Text className="font-inter-semibold text-background-dark flex-1 mr-2" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="font-sora-semibold text-background-dark">
                    {formatPln(Number(item.grossAmount))}
                  </Text>
                </View>
                <Text className="font-inter text-muted text-xs mt-0.5">
                  {Number(item.quantity)} {item.unit} × {formatPln(Number(item.unitPrice))} + VAT {item.vatRate}%
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* KSeF info */}
        {invoice.ksefId && (
          <Card variant="bordered" className="p-4 mb-4">
            <Text className="font-inter-semibold text-muted text-xs mb-1">KSEF</Text>
            <Text className="font-inter text-background-dark text-sm" numberOfLines={2}>
              {invoice.ksefId}
            </Text>
            <Text className="font-inter text-muted text-xs mt-1">
              Źródło: {invoice.source}
            </Text>
          </Card>
        )}

        {/* Actions */}
        {canMarkPaid && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Oznaczyć jako opłaconą?', 'Tej operacji nie można cofnąć.', [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Oznacz opłaconą', onPress: () => markPaidMutation.mutate() },
              ])
            }
            disabled={markPaidMutation.isPending}
            className="mb-8"
            accessibilityRole="button"
            accessibilityLabel="Oznacz jako opłaconą"
          >
            <LinearGradient
              colors={['#0E9F6E', '#059669']}
              className="h-14 rounded-button items-center justify-center"
            >
              <Text className="text-white font-sora-semibold text-base">
                {markPaidMutation.isPending ? 'Zapisywanie...' : '✓ Oznacz jako opłaconą'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
