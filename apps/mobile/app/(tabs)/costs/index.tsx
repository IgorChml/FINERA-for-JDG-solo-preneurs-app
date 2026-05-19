import { View, Text, TouchableOpacity, FlatList, type ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../utils/api';
import { formatPln, formatDate } from '../../../utils/format';
import StatusBadge from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import { COST_CATEGORY_LABELS } from '@finera/shared';
import type { Cost, AiRiskLevel } from '@finera/shared';

export default function CostsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['costs'],
    queryFn: () => api.get<{ data: Cost[] }>('/api/costs'),
  });

  const renderItem: ListRenderItem<Cost> = ({ item }) => (
    <Card className="mx-4 mb-3 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-sora-semibold text-background-dark text-base" numberOfLines={1}>
            {item.vendor}
          </Text>
          <Text className="font-inter text-muted text-xs mt-0.5">
            {COST_CATEGORY_LABELS[item.category]} · {formatDate(item.date)}
          </Text>
        </View>
        <View className="items-end gap-1.5">
          <Text className="font-sora-bold text-danger text-base">
            -{formatPln(Number(item.amount))}
          </Text>
          {item.aiRiskLevel && (
            <StatusBadge variant={item.aiRiskLevel as AiRiskLevel} />
          )}
        </View>
      </View>
      {item.aiRiskReason && (
        <View className="bg-border/40 rounded-lg px-3 py-2 mt-3">
          <Text className="font-inter text-muted text-xs leading-4" numberOfLines={2}>
            🤖 {item.aiRiskReason}
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-sora-bold text-background-dark">Koszty</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/costs/scan' as Parameters<typeof router.push>[0])}
          accessibilityRole="button"
          accessibilityLabel="Skanuj paragon"
        >
          <LinearGradient
            colors={['#0E9F6E', '#059669']}
            className="px-4 h-9 rounded-full flex-row items-center gap-1"
          >
            <Text className="text-white font-inter-semibold text-sm">📸 Skanuj</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="px-4 mb-4">
            {/* AI audit info banner */}
            <View className="bg-primary-50 rounded-card p-3 flex-row items-center gap-3">
              <Text style={{ fontSize: 24 }}>🤖</Text>
              <View className="flex-1">
                <Text className="font-inter-semibold text-primary text-sm">
                  Pre-Audyt AI aktywny
                </Text>
                <Text className="font-inter text-primary text-xs leading-4">
                  Każdy skan jest automatycznie oceniany pod kątem ryzyka podatkowego
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center mt-12 px-8">
            <Text style={{ fontSize: 48 }}>📸</Text>
            <Text className="font-sora-semibold text-background-dark text-lg mt-4 text-center">
              Brak kosztów
            </Text>
            <Text className="font-inter text-muted text-center mt-2 leading-5">
              Skanuj paragony i faktury — AI automatycznie rozpozna dane i oceni ryzyko podatkowe
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/costs/scan' as Parameters<typeof router.push>[0])}
              className="mt-6"
              accessibilityRole="button"
              accessibilityLabel="Skanuj pierwszy paragon"
            >
              <LinearGradient
                colors={['#0E9F6E', '#059669']}
                className="px-8 h-12 rounded-button items-center justify-center"
              >
                <Text className="text-white font-sora-semibold">Skanuj pierwszy paragon</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
