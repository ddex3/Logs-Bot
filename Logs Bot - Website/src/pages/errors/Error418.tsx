import BaseErrorPage from './BaseErrorPage';

export default function Error418() {
  return (
    <BaseErrorPage
      code={418}
      title="I'm a Teapot"
      message="The server refuses to brew coffee because it is, permanently, a teapot. This is a reference to the Hyper Text Coffee Pot Control Protocol."
      actionLabel="Go Home"
      actionPath="/"
      gradientFrom="from-amber-600"
      gradientTo="to-orange-600"
    />
  );
}

