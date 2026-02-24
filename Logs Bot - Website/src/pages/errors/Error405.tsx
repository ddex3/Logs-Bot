import BaseErrorPage from './BaseErrorPage';

export default function Error405() {
  return (
    <BaseErrorPage
      code={405}
      title="Method Not Allowed"
      message="The request method is not supported for this resource. Please try a different action."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-purple-500"
      gradientTo="to-violet-500"
    />
  );
}

