import BaseErrorPage from './BaseErrorPage';

export default function Error504() {
  return (
    <BaseErrorPage
      code={504}
      title="Gateway Timeout"
      message="The server didn't receive a timely response from an upstream server. Please try again in a moment."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-blue-600"
      gradientTo="to-indigo-600"
    />
  );
}

