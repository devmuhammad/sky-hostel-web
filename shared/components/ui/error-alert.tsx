interface ErrorAlertProps {
  error: string | null;
  className?: string;
}

export function ErrorAlert({ error, className = "" }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 ${className}`}
    >
      {error}
    </div>
  );
}
