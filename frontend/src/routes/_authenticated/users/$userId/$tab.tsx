import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProfileSection } from '@/components/user/profile';
import { WorkoutSection } from '@/components/user/workouts';
import { ActivitySection } from '@/components/user/activity';
import { SleepSection } from '@/components/user/sleep';
import { BodySection } from '@/components/user/body';
import { ScoresSection } from '@/components/user/scores';
import { WomensHealthSection } from '@/components/user/womens-health';
import { useUserDetailContext } from '../-user-detail-context';

/** Valid `$tab` segments. Keep in sync with the tab bar in the layout
 * ({@link ../$userId.tsx}). */
const VALID_TABS = new Set([
  'profile',
  'workouts',
  'activity',
  'sleep',
  'body',
  'scores',
  'womens-health',
]);

export const Route = createFileRoute('/_authenticated/users/$userId/$tab')({
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.has(params.tab)) {
      throw redirect({
        to: '/users/$userId/$tab',
        params: { userId: params.userId, tab: 'profile' },
      });
    }
  },
  component: UserTabRoute,
});

function UserTabRoute() {
  const { tab } = Route.useParams();
  const { userId, dateRange } = useUserDetailContext();

  switch (tab) {
    case 'workouts':
      return <WorkoutSection userId={userId} dateRange={dateRange} />;
    case 'activity':
      return <ActivitySection userId={userId} dateRange={dateRange} />;
    case 'sleep':
      return <SleepSection userId={userId} dateRange={dateRange} />;
    case 'body':
      return <BodySection userId={userId} />;
    case 'scores':
      return <ScoresSection userId={userId} dateRange={dateRange} />;
    case 'womens-health':
      return <WomensHealthSection userId={userId} dateRange={dateRange} />;
    case 'profile':
    default:
      return <ProfileSection userId={userId} />;
  }
}
