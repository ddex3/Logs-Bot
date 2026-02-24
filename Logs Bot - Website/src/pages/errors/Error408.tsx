import BaseErrorPage from './BaseErrorPage';

export default function Error408() {
  return (
    <BaseErrorPage
      code={408}
      title="Request Timeout"
      message="The server timed out waiting for your request. Please try again, or check your connection."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-amber-500"
      gradientTo="to-yellow-500"
    />
  );
}

