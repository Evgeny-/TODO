import TimeAgo from 'react-timeago';
import { useMemo } from 'react';

export function TodoDate({ date }: { date: string | Date }) {
  const parsedDate = useMemo(
    () => (date instanceof Date ? date : new Date(date)),
    [date],
  );

  return <TimeAgo date={parsedDate} minPeriod={10} />;
}
