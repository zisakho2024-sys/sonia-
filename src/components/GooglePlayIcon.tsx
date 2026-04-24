import type { SVGProps } from "react";

/** Official Google Play "play" triangle in brand colors. */
export function GooglePlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.6 1.7a1.8 1.8 0 0 0-.9 1.6v17.4c0 .65.34 1.24.88 1.57L13.4 12 3.6 1.7Z"
        fill="#34A853"
      />
      <path
        d="M17.5 8.2 14.9 9.7 4.1 1.5c-.16-.05-.33-.08-.5-.08-.06 0-.13 0-.19.02L13.4 12l4.1-3.8Z"
        fill="#FBBC04"
      />
      <path
        d="M21.4 10.6 17.5 8.2 13.4 12l4.1 3.8 3.9-2.4a1.8 1.8 0 0 0 0-2.8Z"
        fill="#EA4335"
      />
      <path
        d="M3.58 22.27c.32.2.71.27 1.08.16l13.06-7.62-4.32-3.81-9.82 11.27Z"
        fill="#4285F4"
      />
    </svg>
  );
}
