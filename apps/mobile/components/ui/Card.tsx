import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'bordered';
}

export default function Card({ children, className = '', variant = 'default', style, ...props }: CardProps) {
  const variantClass = {
    default: 'bg-surface rounded-card shadow-card',
    elevated: 'bg-surface rounded-card shadow-card-lg',
    bordered: 'bg-surface rounded-card border border-border',
  }[variant];

  return (
    <View className={`${variantClass} ${className}`} style={style} {...props}>
      {children}
    </View>
  );
}
