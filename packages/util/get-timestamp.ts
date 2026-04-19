import dayjs from 'dayjs';

export function getFileTimestamp() {
  return dayjs().format('YYYY-MM-DD HH-mm-ss');
}
