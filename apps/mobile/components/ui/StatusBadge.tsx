import { View, Text } from 'react-native';
import type { InvoiceStatus, AiRiskLevel } from '@finera/shared';

type BadgeVariant = InvoiceStatus | AiRiskLevel | 'FREE' | 'PREMIUM';

const BADGE_CONFIG: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-border', text: 'text-muted', label: 'Szkic' },
  SENT: { bg: 'bg-primary-100', text: 'text-primary', label: 'Wysłana' },
  PAID: { bg: 'bg-success-50', text: 'text-success', label: 'Opłacona' },
  OVERDUE: { bg: 'bg-danger-50', text: 'text-danger', label: 'Przeterminowana' },
  CANCELLED: { bg: 'bg-border', text: 'text-muted', label: 'Anulowana' },
  GREEN: { bg: 'bg-success-50', text: 'text-success', label: 'Niskie ryzyko' },
  YELLOW: { bg: 'bg-warning-50', text: 'text-warning', label: 'Średnie ryzyko' },
  RED: { bg: 'bg-danger-50', text: 'text-danger', label: 'Wysokie ryzyko' },
  FREE: { bg: 'bg-border', text: 'text-muted', label: 'Free' },
  PREMIUM: { bg: 'bg-warning-100', text: 'text-warning-600', label: 'Premium' },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  customLabel?: string;
}

export default function StatusBadge({ variant, customLabel }: StatusBadgeProps) {
  const config = BADGE_CONFIG[variant] ?? BADGE_CONFIG.DRAFT;
  return (
    <View className={`${config.bg} px-2.5 py-1 rounded-badge self-start`}>
      <Text className={`${config.text} text-xs font-inter-semibold`}>
        {customLabel ?? config.label}
      </Text>
    </View>
  );
}
