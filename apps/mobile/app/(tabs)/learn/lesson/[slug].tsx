import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../../utils/api';
import type { LessonDetail } from '@finera/shared';

interface QuizQuestion {
  id: string;
  question: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
  explanation: string;
}

interface AnswerState {
  selected: number | null;
  revealed: boolean;
}

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, AnswerState>>({});
  const [quizDone, setQuizDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => api.get<{ lesson: LessonDetail }>(`/api/education/lessons/${slug}`),
    enabled: !!slug,
  });

  const completeMutation = useMutation({
    mutationFn: (answers: Array<{ questionId: string; answerIndex: number }>) =>
      api.post<{ score: number; passed: boolean }>(`/api/education/lessons/${slug}/complete`, {
        quizAnswers: answers,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['education-recommended'] });
      queryClient.invalidateQueries({ queryKey: ['education-categories'] });
      Alert.alert(
        result.passed ? '🎉 Gratulacje!' : '📖 Spróbuj ponownie',
        `Wynik: ${result.score}/100${result.passed ? '\nLekcja ukończona!' : '\nPotrzebujesz min. 60 punktów'}`,
        [{ text: 'OK', onPress: result.passed ? () => router.back() : undefined }]
      );
    },
  });

  const lesson = data?.lesson;

  const handleAnswer = (questionId: string, answerIndex: number) => {
    if (quizAnswers[questionId]?.revealed) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: { selected: answerIndex, revealed: true },
    }));
  };

  const handleSubmitQuiz = () => {
    if (!lesson) return;
    const answers = lesson.quizQuestions
      .map((q: QuizQuestion) => ({
        questionId: q.id,
        answerIndex: quizAnswers[q.id]?.selected ?? 0,
      }))
      .filter((a) => quizAnswers[a.questionId]?.selected !== null);

    if (answers.length < lesson.quizQuestions.length) {
      Alert.alert('Odpowiedz na wszystkie pytania', 'Zaznacz odpowiedź dla każdego pytania.');
      return;
    }

    completeMutation.mutate(answers);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#1A56DB" size="large" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="font-sora-semibold text-background-dark text-lg text-center">Lekcja nie znaleziona</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-inter-semibold">← Wróć</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3 bg-surface border-b border-border">
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Wróć">
          <Text className="text-primary font-inter-semibold text-base">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-sora-semibold text-background-dark text-base" numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text className="font-inter text-muted text-xs">{lesson.readTimeMinutes} min · {lesson.categoryName}</Text>
        </View>
        {lesson.isCompleted && (
          <View className="w-7 h-7 bg-success rounded-full items-center justify-center">
            <Text className="text-white text-xs font-sora-bold">✓</Text>
          </View>
        )}
      </View>

      <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Disclaimer — sticky banner */}
        <View className="bg-warning-50 px-5 py-3 flex-row items-center gap-2">
          <Text>ℹ️</Text>
          <Text className="font-inter text-warning-600 text-xs flex-1 leading-4">
            Treść ma charakter edukacyjny. Nie stanowi porady prawnej ani podatkowej.
          </Text>
        </View>

        {/* Content */}
        <View className="px-5 py-6">
          <LessonContent content={lesson.contentMdx} />
        </View>

        {/* Legal source */}
        {lesson.legalSource && (
          <View className="px-5 mb-6">
            <TouchableOpacity
              onPress={() => Linking.openURL(lesson.legalSource!)}
              className="bg-border/30 rounded-card p-3 flex-row items-center gap-2"
              accessibilityRole="link"
              accessibilityLabel="Źródło prawne"
            >
              <Text>📎</Text>
              <Text className="text-primary font-inter-semibold text-sm">Źródło prawne — ISAP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quiz */}
        <View className="px-5 mb-8">
          <View className="h-px bg-border mb-6" />
          <Text className="font-sora-bold text-background-dark text-lg mb-2">✏️ Sprawdź wiedzę</Text>
          <Text className="font-inter text-muted text-sm mb-6">
            Odpowiedz na pytania, by oznaczyć lekcję jako ukończoną
          </Text>

          {lesson.quizQuestions.map((q: QuizQuestion, qi: number) => {
            const state = quizAnswers[q.id];
            return (
              <View key={q.id} className="mb-6">
                <Text className="font-inter-semibold text-background-dark text-base mb-3">
                  {qi + 1}. {q.question}
                </Text>
                <View className="gap-2">
                  {q.answers.map((ans, ai) => {
                    const isSelected = state?.selected === ai;
                    const isRevealed = state?.revealed;
                    const isCorrect = ans.isCorrect;

                    let borderColor = 'border-border';
                    let bgColor = 'bg-surface';
                    if (isRevealed && isCorrect) { borderColor = 'border-success'; bgColor = 'bg-success-50'; }
                    else if (isRevealed && isSelected && !isCorrect) { borderColor = 'border-danger'; bgColor = 'bg-danger-50'; }
                    else if (isSelected) { borderColor = 'border-primary'; bgColor = 'bg-primary-50'; }

                    return (
                      <TouchableOpacity
                        key={ai}
                        onPress={() => handleAnswer(q.id, ai)}
                        className={`px-4 py-3 rounded-button border-2 ${borderColor} ${bgColor}`}
                        accessibilityRole="radio"
                        accessibilityLabel={ans.text}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text className={`font-inter text-sm ${isRevealed && isCorrect ? 'text-success font-inter-semibold' : isRevealed && isSelected && !isCorrect ? 'text-danger' : 'text-background-dark'}`}>
                          {ans.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {state?.revealed && (
                  <View className="mt-3 bg-border/30 rounded-lg px-3 py-2">
                    <Text className="font-inter text-muted text-sm leading-5">
                      💡 {q.explanation}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={handleSubmitQuiz}
            disabled={completeMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Zakończ lekcję"
          >
            <LinearGradient
              colors={completeMutation.isPending ? ['#9CA3AF', '#9CA3AF'] : ['#1A56DB', '#2563EB']}
              className="h-14 rounded-button items-center justify-center"
            >
              <Text className="text-white font-sora-semibold text-base">
                {completeMutation.isPending ? 'Sprawdzanie...' : '✓ Zakończ lekcję'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple Markdown → React Native renderer
function LessonContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <View className="gap-2">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <Text key={i} className="font-sora-bold text-background-dark text-lg mt-4 mb-1">
              {line.replace('## ', '')}
            </Text>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <Text key={i} className="font-sora-semibold text-background-dark text-base mt-3 mb-1">
              {line.replace('### ', '')}
            </Text>
          );
        }
        if (line.startsWith('> ')) {
          return (
            <View key={i} className="bg-warning-50 border-l-4 border-warning px-3 py-2 rounded-r-lg my-2">
              <Text className="font-inter text-warning-600 text-sm leading-5">
                {line.replace('> ', '').replace(/\*\*(.*?)\*\*/g, '$1')}
              </Text>
            </View>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={i} className="flex-row items-start gap-2 ml-2">
              <Text className="text-primary font-sora-bold mt-0.5">·</Text>
              <Text className="flex-1 font-inter text-background-dark text-sm leading-5">
                {line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1')}
              </Text>
            </View>
          );
        }
        if (line.startsWith('**💡')) {
          return (
            <View key={i} className="bg-primary-50 rounded-card px-4 py-3 my-2">
              <Text className="font-inter-semibold text-primary text-sm leading-5">
                {line.replace(/\*\*(.*?)\*\*/g, '$1')}
              </Text>
            </View>
          );
        }
        if (line.startsWith('|')) return null; // Skip table lines for simplicity
        if (line.startsWith('```') || line === '') return null;

        return (
          <Text key={i} className="font-inter text-background-dark text-sm leading-6">
            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
          </Text>
        );
      })}
    </View>
  );
}
