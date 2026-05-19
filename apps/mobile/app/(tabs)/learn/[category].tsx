import { View, Text, FlatList, TouchableOpacity, type ListRenderItem } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../utils/api';
import type { LessonSummary } from '@finera/shared';

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['education-lessons', category],
    queryFn: () =>
      api.get<{ lessons: LessonSummary[] }>(`/api/education/lessons?categorySlug=${category}`),
    enabled: !!category,
  });

  const lessons = data?.lessons ?? [];

  const renderItem: ListRenderItem<LessonSummary> = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/learn/lesson/${item.slug}` as Parameters<typeof router.push>[0])}
      className="bg-surface mx-4 mb-3 rounded-card p-4 border border-border"
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-sora-semibold text-background-dark text-base mb-1" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="font-inter text-muted text-sm" numberOfLines={2}>{item.summary}</Text>
        </View>
        {item.isCompleted && (
          <View className="w-6 h-6 bg-success rounded-full items-center justify-center">
            <Text className="text-white text-xs font-sora-bold">✓</Text>
          </View>
        )}
      </View>
      <Text className="font-inter text-muted text-xs mt-2">{item.readTimeMinutes} min czytania</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Wróć">
          <Text className="text-primary font-inter-semibold text-base">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-sora-bold text-background-dark">Lekcje</Text>
      </View>
      <FlatList
        data={lessons}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center mt-12 px-8">
              <Text style={{ fontSize: 48 }}>📚</Text>
              <Text className="font-sora-semibold text-background-dark text-lg mt-4 text-center">
                Brak lekcji w tej kategorii
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
