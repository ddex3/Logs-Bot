import BaseErrorPage from './BaseErrorPage';

export default function Error409() {
  return (
    <BaseErrorPage
      code={409}
      title="Conflict"
      message="The request conflicts with the current state of the resource. This usually means a duplicate entry or concurrent modification."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-orange-500"
      gradientTo="to-amber-500"
    />
  );
}

