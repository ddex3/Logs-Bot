import BaseErrorPage from './BaseErrorPage';

export default function Error500() {
  return (
    <BaseErrorPage
      code={500}
      title="Internal Server Error"
      message="Something went wrong on our end. We've been notified and are working to fix the issue. Please try again later."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-red-600"
      gradientTo="to-red-700"
    />
  );
}

