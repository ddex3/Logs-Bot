import BaseErrorPage from './BaseErrorPage';

export default function Error401() {
  return (
    <BaseErrorPage
      code={401}
      title="Unauthorized"
      message="You need to be authenticated to access this resource. Please log in to continue."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-yellow-500"
      gradientTo="to-orange-500"
    />
  );
}

