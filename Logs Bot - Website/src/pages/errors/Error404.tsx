import BaseErrorPage from './BaseErrorPage';

export default function Error404() {
  return (
    <BaseErrorPage
      code={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved. Double-check the URL or return to the homepage."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-blue-500"
      gradientTo="to-indigo-500"
    />
  );
}

