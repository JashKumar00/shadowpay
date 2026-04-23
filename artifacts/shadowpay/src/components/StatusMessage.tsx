interface StatusMessageProps {
  type: "success" | "error" | "info";
  message: string;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  const colors = {
    success: "bg-green-900/40 border-green-500 text-green-300",
    error: "bg-red-900/40 border-red-500 text-red-300",
    info: "bg-blue-900/40 border-blue-500 text-blue-300",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${colors[type]}`}>
      {message}
    </div>
  );
}
