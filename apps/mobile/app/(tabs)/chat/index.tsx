import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../utils/api';
import { useSubscriptionStore } from '../../../stores/subscription.store';
import { useRouter } from 'expo-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: number;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'Czy abonament na siłownię jest kosztem?',
  'Jak rozliczyć laptop używany do pracy?',
  'Kiedy zapłacę VAT za ten miesiąc?',
  'Jakie są stawki ZUS w 2026?',
];

export default function ChatScreen() {
  const router = useRouter();
  const { canAccess } = useSubscriptionStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Cześć! Jestem Twoim AI Doradcą Podatkowym 🤖\n\nMogę odpowiadać na pytania dotyczące polskiego prawa podatkowego dla JDG — VAT, PIT, ZUS, koszty firmowe.\n\nPamiętaj: moje odpowiedzi są wsparciem, nie poradą prawną. W trudnych przypadkach zawsze warto skonsultować się z księgowym.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  if (!canAccess('ai_tax_advisor')) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text className="font-sora-bold text-background-dark text-xl text-center mt-4">
          Konsjerż Podatkowy Premium
        </Text>
        <Text className="font-inter text-muted text-center mt-2 leading-5">
          Nielimitowany dostęp do AI Doradcy Podatkowego z wiedzą o polskim prawie dostępny w Premium
        </Text>
      </SafeAreaView>
    );
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await api.post<{
        answer: string;
        sources: string[];
        confidence: number;
      }>('/api/chat', {
        message: text.trim(),
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę lub zadaj pytanie inaczej.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading]);

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.role === 'user';
    const lowConfidence = typeof item.confidence === 'number' && item.confidence < 0.75;

    return (
      <View className={`px-4 mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-7 h-7 bg-primary-100 rounded-full items-center justify-center">
              <Text style={{ fontSize: 14 }}>🤖</Text>
            </View>
            <Text className="text-xs font-inter text-muted">AI Doradca</Text>
          </View>
        )}

        <View
          className={`max-w-xs rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary rounded-tr-sm'
              : 'bg-surface border border-border rounded-tl-sm'
          }`}
          style={{ maxWidth: '80%' }}
        >
          <Text className={`font-inter text-sm leading-5 ${isUser ? 'text-white' : 'text-background-dark'}`}>
            {item.content}
          </Text>
        </View>

        {/* Sources */}
        {item.sources && item.sources.length > 0 && (
          <View className="mt-1 ml-1">
            {item.sources.map((src, i) => (
              <Text key={i} className="text-xs font-inter text-primary">
                📎 {src}
              </Text>
            ))}
          </View>
        )}

        {/* Low confidence warning */}
        {lowConfidence && (
          <View className="bg-warning-50 rounded-lg px-3 py-2 mt-1 max-w-xs" style={{ maxWidth: '80%' }}>
            <Text className="text-xs font-inter text-warning-600">
              ⚠️ To złożone pytanie — polecam konsultację z księgowym
            </Text>
          </View>
        )}

        {/* Disclaimer */}
        {!isUser && (
          <Text className="text-xs font-inter text-muted mt-1 ml-1">
            Podpowiedź AI — nie stanowi porady podatkowej
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-border">
          <Text className="text-2xl font-sora-bold text-background-dark">🤖 Doradca Podatkowy</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">
            Oparty na polskim prawie podatkowym · RAG
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1 pt-4"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isLoading ? (
              <View className="px-4 mb-4 items-start">
                <View className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <ActivityIndicator color="#1A56DB" size="small" />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick questions */}
        {messages.length === 1 && (
          <View className="px-4 pb-3">
            <Text className="text-xs font-inter text-muted mb-2">Przykładowe pytania:</Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => sendMessage(q)}
                  className="bg-primary-50 px-3 py-1.5 rounded-full"
                  accessibilityRole="button"
                  accessibilityLabel={q}
                >
                  <Text className="text-primary text-xs font-inter-semibold">{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View className="px-4 pb-4 pt-2 flex-row items-end gap-2 border-t border-border bg-surface">
          <TextInput
            className="flex-1 bg-background border border-border rounded-2xl px-4 py-3 font-inter text-background-dark text-sm max-h-28"
            placeholder="Zadaj pytanie podatkowe..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            accessibilityLabel="Pole wiadomości"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Wyślij wiadomość"
          >
            <LinearGradient
              colors={
                !inputText.trim() || isLoading
                  ? ['#9CA3AF', '#9CA3AF']
                  : ['#1A56DB', '#2563EB']
              }
              className="w-11 h-11 rounded-full items-center justify-center"
            >
              <Text className="text-white font-sora-bold text-base">↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
