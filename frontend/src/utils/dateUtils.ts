import type { TimeFrame } from '../types';

export const getTimeRangeFromTimeFrame = (timeFrame: TimeFrame): { startTime: Date; endTime: Date } => {
  const now = new Date();
  const endTime = new Date(now);
  let startTime: Date;

  switch (timeFrame) {
    case 'LAST_HOUR':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'LAST_DAY':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'LAST_WEEK':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'LAST_MONTH':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
  }

  return { startTime, endTime };
};

export const shouldUseAggregatedData = (timeFrame: TimeFrame): boolean => {
  return timeFrame === 'LAST_DAY' || timeFrame === 'LAST_WEEK' || timeFrame === 'LAST_MONTH';
};

export const shouldUseDailyAggregatedData = (timeFrame: TimeFrame): boolean => {
  return timeFrame === 'LAST_MONTH';
};

export const formatTimestamp = (timestamp: string, timeFrame: TimeFrame): string => {
  const date = new Date(timestamp);

  switch (timeFrame) {
    case 'LAST_HOUR':
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'LAST_DAY':
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'LAST_WEEK': {
      const weekday = date.toLocaleString('en-US', { weekday: 'short' });
      const time = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${weekday} ${time}`;
    }
    case 'LAST_MONTH': {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = String(date.getDate()).padStart(2, '0');
      return `${month} ${day}`;
    }
    default:
      return date.toLocaleTimeString();
  }
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};