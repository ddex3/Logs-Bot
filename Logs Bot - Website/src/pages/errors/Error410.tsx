import BaseErrorPage from './BaseErrorPage';

export default function Error410() {
  return (
    <BaseErrorPage
      code={410}
      title="Gone"
      message="The requested resource is no longer available and has been permanently removed from the server."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-gray-500"
      gradientTo="to-slate-500"
    />
  );
}

