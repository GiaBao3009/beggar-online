export function Icon({
  name,
  size = 20,
}: {
  name: "heart" | "arrow" | "sound" | "mute" | "cup" | "close" | "check" | "print"
  size?: number
}) {
  const paths = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    sound: "M11 4 5 9H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
    mute: "M11 4 5 9H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6",
    cup: "M5 5h12v10a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V5Zm12 1h2a3 3 0 0 1 0 6h-2M3 23h16",
    close: "m6 6 12 12M6 18 18 6",
    check: "m5 12 4 4L19 6",
    print: "M6 9V3h12v6M6 17H3v-7h18v7h-3M6 14h12v7H6v-7Z",
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
