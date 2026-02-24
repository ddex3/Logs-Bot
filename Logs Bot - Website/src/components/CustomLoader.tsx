import BeatLoader from 'react-spinners/BeatLoader';

interface CustomLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomLoader({ message = 'Loading...', size = 'md' }: CustomLoaderProps) {
  const sizeMap = {
    sm: 6,
    md: 10,
    lg: 15
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <BeatLoader size={sizeMap[size]} color="#2563eb" />
      {message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
}
