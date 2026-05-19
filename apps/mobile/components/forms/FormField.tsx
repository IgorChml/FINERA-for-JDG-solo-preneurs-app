import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function FormField({ label, error, style, ...props }: FormFieldProps) {
  return (
    <View>
      <Text className="text-sm font-inter-semibold text-background-dark mb-1.5">
        {label}
      </Text>
      <TextInput
        className={`bg-surface border rounded-button px-4 h-12 font-inter text-background-dark text-base ${
          error ? 'border-danger' : 'border-border'
        }`}
        placeholderTextColor="#9CA3AF"
        style={style}
        {...props}
      />
      {error ? (
        <Text className="text-danger text-xs font-inter mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
