import BaseErrorPage from './BaseErrorPage';

export default function Error400() {
  return (
    <BaseErrorPage
      code={400}
      title="Bad Request"
      message="The request you sent was invalid or malformed. Please check your input and try again."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-orange-500"
      gradientTo="to-red-500"
    />
  );
}

