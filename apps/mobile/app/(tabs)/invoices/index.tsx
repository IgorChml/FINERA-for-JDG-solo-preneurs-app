import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../utils/api';
import { formatPln, formatDate, isOverdue } from '../../../utils/format';
import StatusBadge from '../../../components/ui/StatusBadge';
import type { Invoice, InvoiceStatus } from '@finera/shared';

type TabType = 'INCOME' | 'COST';

export default function InvoicesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('INCOME');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', activeTab, search],
    queryFn: () =>
      api.get<{ data: Invoice[]; total: number }>(
        `/api/invoices?type=${activeTab}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      ),
    placeholderData: (prev) => prev,
  });

  const renderItem: ListRenderItem<Invoice> = ({ item }) => {
    const overdue = item.status !== 'PAID' && isOverdue(item.dueDate);
    const displayStatus: InvoiceStatus = overdue && item.status === 'SENT' ? 'OVERDUE' : item.status;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/invoices/${item.id}` as Parameters<typeof router.push>[0])}
        className="bg-surface mx-4 mb-3 rounded-card p-4 border border-border"
        accessibilityRole="button"
        accessibilityLabel={`Faktura ${item.invoiceNumber} — ${formatPln(Number(item.grossAmount))}`}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="font-sora-semibold text-background-dark text-base" numberOfLines={1}>
              {activeTab === 'INCOME' ? item.buyerName : item.sellerName}
            </Text>
            <Text className="font-inter text-muted text-xs mt-0.5">{item.invoiceNumber}</Text>
          </View>
          <Text className={`font-sora-bold text-lg ${activeTab === 'INCOME' ? 'text-success' : 'text-danger'}`}>
            {activeTab === 'INCOME' ? '+' : '-'}{formatPln(Number(item.grossAmount))}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <StatusBadge variant={displayStatus} />
          <Text className="font-inter text-muted text-xs">
            Termin: {formatDate(item.dueDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-sora-bold text-background-dark">Faktury</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/invoices/create' as Parameters<typeof router.push>[0])}
            accessibilityRole="button"
            accessibilityLabel="Nowa faktura"
          >
            <LinearGradient
              colors={['#1A56DB', '#2563EB']}
              className="px-4 h-9 rounded-full flex-row items-center gap-1"
            >
              <Text className="text-white font-inter-semibold text-sm">+ Nowa</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-border rounded-button p-1 mb-3">
          {(['INCOME', 'COST'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 h-9 rounded-lg items-center justify-center ${
                activeTab === tab ? 'bg-white' : ''
              }`}
              accessibilityRole="tab"
              accessibilityLabel={tab === 'INCOME' ? 'Przychody' : 'Koszty'}
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text className={`text-sm font-inter-semibold ${activeTab === tab ? 'text-primary' : 'text-muted'}`}>
                {tab === 'INCOME' ? '📈 Przychody' : '📉 Koszty'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-surface border border-border rounded-button px-3 h-10">
          <Text className="mr-2 text-muted">🔍</Text>
          <TextInput
            className="flex-1 font-inter text-background-dark text-sm"
            placeholder="Szukaj po nazwie lub NIP..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Wyszukaj fakturę"
          />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1A56DB" />
      ) : (
        <FlatList
          data={data?.data ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center mt-16 px-8">
              <Text style={{ fontSize: 48 }}>🧾</Text>
              <Text className="font-sora-semibold text-background-dark text-lg mt-4 text-center">
                Brak faktur
              </Text>
              <Text className="font-inter text-muted text-center mt-2">
                {search
                  ? 'Brak wyników dla podanego zapytania'
                  : activeTab === 'INCOME'
                  ? 'Wystaw pierwszą fakturę lub połącz się z KSeF'
                  : 'Koszty pojawią się tu po synchronizacji z KSeF'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
