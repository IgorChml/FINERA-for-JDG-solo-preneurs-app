import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, type ListRenderItem } from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  options: readonly Option[] | Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export default function SelectField({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = 'Wybierz...',
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const renderOption: ListRenderItem<Option> = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        onChange(item.value);
        setOpen(false);
      }}
      className={`px-4 py-4 border-b border-border ${
        item.value === value ? 'bg-primary-50' : 'bg-surface'
      }`}
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: item.value === value }}
    >
      <Text
        className={`font-inter text-base ${
          item.value === value ? 'text-primary font-inter-semibold' : 'text-background-dark'
        }`}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text className="text-sm font-inter-semibold text-background-dark mb-1.5">{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`bg-surface border rounded-button px-4 h-12 flex-row items-center justify-between ${
          error ? 'border-danger' : 'border-border'
        }`}
        accessibilityRole="combobox"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ expanded: open }}
      >
        <Text className={selected ? 'font-inter text-background-dark' : 'font-inter text-muted'}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-muted">▾</Text>
      </TouchableOpacity>
      {error ? <Text className="text-danger text-xs font-inter mt-1">{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          onPress={() => setOpen(false)}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Zamknij"
        >
          <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl overflow-hidden pb-8">
            <View className="h-1 w-12 bg-border rounded-full self-center mt-3 mb-4" />
            <Text className="font-sora-semibold text-background-dark text-lg px-4 mb-2">
              {label}
            </Text>
            <FlatList
              data={options as Option[]}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
