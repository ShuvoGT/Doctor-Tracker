import { CONDITION_STYLES } from '@/lib/constants';

export function ConditionBadge({ condition }) {
  const style = CONDITION_STYLES[condition] || CONDITION_STYLES.Stable;
  return <span className={`badge ${style}`}>{condition}</span>;
}
