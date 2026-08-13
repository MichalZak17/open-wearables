import { createContext, useContext } from 'react';
import type { PeriodValue } from '@/components/ui/date-range-selector';

export interface UserDetailContextValue {
  userId: string;
  /** Date range shared by the data tabs; controlled by the layout's selector. */
  dateRange: PeriodValue;
}

const UserDetailContext = createContext<UserDetailContextValue | null>(null);

export const UserDetailProvider = UserDetailContext.Provider;

/** Access the user id + shared date range from a user-detail tab route. */
export function useUserDetailContext(): UserDetailContextValue {
  const ctx = useContext(UserDetailContext);
  if (!ctx) {
    throw new Error(
      'useUserDetailContext must be used within the user detail layout'
    );
  }
  return ctx;
}
