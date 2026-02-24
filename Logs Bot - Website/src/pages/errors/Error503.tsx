import BaseErrorPage from './BaseErrorPage';

export default function Error503() {
  return (
    <BaseErrorPage
      code={503}
      title="Service Unavailable"
      message="The service is temporarily unavailable due to maintenance or high load. We'll be back shortly."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-yellow-600"
      gradientTo="to-orange-600"
    />
  );
}

