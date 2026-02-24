import BaseErrorPage from './BaseErrorPage';

export default function Error429() {
  return (
    <BaseErrorPage
      code={429}
      title="Too Many Requests"
      message="You've made too many requests in a short period. Please wait a moment before trying again."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-red-500"
      gradientTo="to-rose-500"
    />
  );
}

