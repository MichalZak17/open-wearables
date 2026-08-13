import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/users/$userId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/users/$userId/$tab',
      params: { userId: params.userId, tab: 'profile' },
    });
  },
});
