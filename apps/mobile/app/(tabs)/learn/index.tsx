import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebouncedCallback } from 'use-debounce';
import { api } from '../../../utils/api';
import Card from '../../../components/ui/Card';
import type { LessonSummary } from '@finera/shared';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  lessonsCount: number;
  completedCount: number;
}

export default function LearnScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounce = useDebouncedCallback((v: string) => setDebouncedSearch(v), 300);

  const categoriesQuery = useQuery({
    queryKey: ['education-categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/api/education/categories'),
  });

  const recommendedQuery = useQuery({
    queryKey: ['education-recommended'],
    queryFn: () => api.get<{ lessons: LessonSummary[] }>('/api/education/recommended'),
  });

  const searchQuery = useQuery({
    queryKey: ['education-search', debouncedSearch],
    queryFn: () =>
      api.get<{ lessons: LessonSummary[] }>(`/api/education/lessons?search=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length > 1,
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const recommended = recommendedQuery.data?.lessons ?? [];
  const searchResults = searchQuery.data?.lessons ?? [];

  const totalLessons = categories.reduce((s, c) => s + c.lessonsCount, 0);
  const completedLessons = categories.reduce((s, c) => s + c.completedCount, 0);

  const handleRefresh = useCallback(() => {
    categoriesQuery.refetch();
    recommendedQuery.refetch();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={categoriesQuery.isFetching} onRefresh={handleRefresh} tintColor="#1A56DB" />}
      >
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-sora-bold text-background-dark">Wiedza</Text>
          <Text className="text-muted font-inter text-sm mt-0.5">
            Prawo podatkowe dla solopreneur'ów
          </Text>

          {/* Global progress */}
          {totalLessons > 0 && (
            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="font-inter text-muted text-xs">Postęp</Text>
                <Text className="font-inter-semibold text-primary text-xs">
                  {completedLessons} / {totalLessons} lekcji
                </Text>
              </View>
              <View className="h-1.5 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
                />
              </View>
            </View>
          )}

          {/* Search */}
          <View className="flex-row items-center bg-surface border border-border rounded-button px-3 h-10 mt-4">
            <Text className="mr-2 text-muted">🔍</Text>
            <TextInput
              className="flex-1 font-inter text-background-dark text-sm"
              placeholder="Szukaj lekcji..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={(v) => { setSearch(v); debounce(v); }}
              accessibilityLabel="Wyszukaj lekcję"
            />
          </View>
        </View>

        {/* Search results */}
        {debouncedSearch.length > 1 && (
          <View className="px-5 mb-6">
            <Text className="font-inter-semibold text-muted text-sm mb-3">
              Wyniki wyszukiwania ({searchResults.length})
            </Text>
            {searchQuery.isLoading ? (
              <ActivityIndicator color="#1A56DB" />
            ) : (
              searchResults.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onPress={() =>
                  router.push(`/(tabs)/learn/lesson/${lesson.slug}` as Parameters<typeof router.push>[0])
                } />
              ))
            )}
          </View>
        )}

        {debouncedSearch.length <= 1 && (
          <>
            {/* Recommended */}
            {recommended.length > 0 && (
              <View className="px-5 mb-6">
                <Text className="text-base font-sora-semibold text-background-dark mb-3">
                  ⭐ Polecane dla Ciebie
                </Text>
                {recommended.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} onPress={() =>
                    router.push(`/(tabs)/learn/lesson/${lesson.slug}` as Parameters<typeof router.push>[0])
                  } />
                ))}
              </View>
            )}

            {/* Categories grid */}
            <View className="px-5 mb-8">
              <Text className="text-base font-sora-semibold text-background-dark mb-3">
                📚 Biblioteka
              </Text>
              {categoriesQuery.isLoading ? (
                <ActivityIndicator color="#1A56DB" />
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => router.push(`/(tabs)/learn/${cat.slug}` as Parameters<typeof router.push>[0])}
                      style={{ width: '47%' }}
                      className="bg-surface rounded-card p-4 border border-border"
                      accessibilityRole="button"
                      accessibilityLabel={`Kategoria ${cat.name}`}
                    >
                      <Text style={{ fontSize: 28 }} className="mb-2">
                        {cat.icon === 'ti-building-store' ? '🏪' :
                         cat.icon === 'ti-receipt-tax' ? '🧾' :
                         cat.icon === 'ti-heart-rate-monitor' ? '💊' : '🛒'}
                      </Text>
                      <Text className="font-sora-semibold text-background-dark text-sm mb-1" numberOfLines={2}>
                        {cat.name}
                      </Text>
                      <Text className="font-inter text-muted text-xs mb-2">
                        {cat.completedCount}/{cat.lessonsCount} lekcji
                      </Text>
                      <View className="h-1 bg-border rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${cat.lessonsCount > 0 ? (cat.completedCount / cat.lessonsCount) * 100 : 0}%` }}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonCard({ lesson, onPress }: { lesson: LessonSummary; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-surface rounded-card p-4 mb-3 border border-border" accessibilityRole="button" accessibilityLabel={lesson.title}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-sora-semibold text-background-dark text-base mb-1" numberOfLines={2}>
            {lesson.title}
          </Text>
          <Text className="font-inter text-muted text-xs" numberOfLines={2}>{lesson.summary}</Text>
        </View>
        {lesson.isCompleted && (
          <View className="w-6 h-6 bg-success rounded-full items-center justify-center">
            <Text className="text-white text-xs font-sora-bold">✓</Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-2 mt-2">
        <Text className="text-muted text-xs font-inter">{lesson.readTimeMinutes} min</Text>
        <Text className="text-muted text-xs">·</Text>
        <Text className="text-muted text-xs font-inter">{lesson.categoryName}</Text>
      </View>
    </TouchableOpacity>
  );
}
