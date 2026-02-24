import BaseErrorPage from './BaseErrorPage';

export default function Error502() {
  return (
    <BaseErrorPage
      code={502}
      title="Bad Gateway"
      message="The server received an invalid response from an upstream server. This is usually temporary-please try again in a moment."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-orange-600"
      gradientTo="to-red-600"
    />
  );
}

