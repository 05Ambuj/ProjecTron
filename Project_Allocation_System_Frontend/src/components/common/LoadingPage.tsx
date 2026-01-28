import LoadingSpinner from "./LoadingSpinner";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingPage({ 
  message = "Loading...", 
  fullScreen = true 
}: LoadingPageProps) {
  const containerClass = fullScreen
    ? "min-h-screen bg-neutral-100 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-neutral-600">{message}</p>
      </div>
    </div>
  );
}
