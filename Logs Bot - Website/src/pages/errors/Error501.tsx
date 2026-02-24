import BaseErrorPage from './BaseErrorPage';

export default function Error501() {
  return (
    <BaseErrorPage
      code={501}
      title="Not Implemented"
      message="The server doesn't support the functionality required to fulfill this request. This feature may be under development."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-gray-600"
      gradientTo="to-gray-700"
    />
  );
}

