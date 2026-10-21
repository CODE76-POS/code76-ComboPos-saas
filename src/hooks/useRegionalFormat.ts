import { usePOS } from '../context/POSContext.tsx';
import { dateOnly, dateTime, timeOnly, calendarDate } from '../utils/regional.ts';
export function useRegionalFormat() {
  const { settings } = usePOS();
  return { inputDate:(value:string|Date)=>calendarDate(value,settings), date: (value:string|Date) => dateOnly(value,settings), dateTime:(value:string|Date)=>dateTime(value,settings), time:(value:string|Date)=>timeOnly(value,settings) };
}
