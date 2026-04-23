export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#7c3aed" opacity="0.25" />
      <circle cx="16" cy="16" r="10" fill="#7c3aed" opacity="0.15" />
      <path
        d="M16 8C11.582 8 8 11.582 8 16s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3.2a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm0 11.2c-2.208 0-4.16-1.12-5.34-2.832C11.892 18.304 13.9 17.6 16 17.6s4.108.704 5.34 1.968C20.16 21.28 18.208 22.4 16 22.4z"
        fill="#a855f7"
      />
    </svg>
  );
}
