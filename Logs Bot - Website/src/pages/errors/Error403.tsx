import BaseErrorPage from './BaseErrorPage';

export default function Error403() {
  return (
    <BaseErrorPage
      code={403}
      title="Forbidden"
      message="You don't have permission to access this resource. Contact an administrator if you believe this is an error."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-red-500"
      gradientTo="to-pink-500"
    />
  );
}

