export default function StreetProps() {
  return (
    <>
      <svg
        className="broken-radio"
        viewBox="0 0 150 100"
        aria-label="Chiếc radio cũ bị hỏng"
        role="img"
      >
        <defs>
          <linearGradient id="radio-metal" x2=".8" y2="1">
            <stop stopColor="#777663" />
            <stop offset="1" stopColor="#393e32" />
          </linearGradient>
          <pattern
            id="speaker-grille"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <rect width="4" height="4" fill="#363b31" />
            <circle cx="2" cy="2" r="1" fill="#171e17" />
          </pattern>
        </defs>
        <path
          d="M27 27V16Q26 8 36 8H106Q116 8 116 16V27"
          fill="none"
          stroke="#363d30"
          strokeWidth="7"
        />
        <path d="M29 22 14 1" stroke="#9a9982" strokeWidth="2" />
        <rect
          x="6"
          y="25"
          width="137"
          height="67"
          rx="6"
          fill="url(#radio-metal)"
          stroke="#252d22"
          strokeWidth="3"
        />
        <rect
          x="14"
          y="34"
          width="68"
          height="49"
          rx="3"
          fill="url(#speaker-grille)"
          stroke="#8a89713d"
          strokeWidth="2"
        />
        <rect x="92" y="35" width="40" height="17" fill="#a6a17b" />
        <path
          d="M96 40h31m-31 4h31m-27-7v8m5-8v8m5-8v8m5-8v8m5-8v8"
          stroke="#525d3f"
          strokeWidth=".8"
        />
        <path d="m118 35-5 17" stroke="#a83224" strokeWidth="1.5" />
        <circle
          cx="101"
          cy="69"
          r="8"
          fill="#262e21"
          stroke="#9b997a"
          strokeWidth="2"
        />
        <circle
          cx="124"
          cy="69"
          r="6"
          fill="#333b2b"
          stroke="#85866b"
          strokeWidth="2"
        />
        <path
          d="m30 36 11 14-5 8 16 7-3 12"
          stroke="#0d190e"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M69 22 83 98"
          stroke="#bfb184"
          strokeWidth="15"
          opacity=".35"
        />
      </svg>
      <svg
        className="plastic-bottle"
        viewBox="0 0 70 160"
        aria-label="Chai nhựa cũ"
        role="img"
      >
        <defs>
          <linearGradient id="bottle-plastic">
            <stop stopColor="#647f7340" />
            <stop offset=".3" stopColor="#acb5a169" />
            <stop offset=".5" stopColor="#66867925" />
            <stop offset=".85" stopColor="#839b866e" />
            <stop offset="1" stopColor="#2a453a85" />
          </linearGradient>
        </defs>
        <path
          d="M26 18h18v18l14 21-4 30 6 15-4 40q-20 11-40 0l-3-29 7-19-6-25 13-32Z"
          fill="url(#bottle-plastic)"
          stroke="#a0b49c55"
          strokeWidth="1.5"
        />
        <rect x="25" y="10" width="20" height="10" rx="2" fill="#7e967d" />
        <path
          d="m19 68 37 3m-39 7 38 4m-36 28 39-3m-40 10 39-2m-39 12 38-1"
          stroke="#b3c2a34d"
          fill="none"
        />
        <path d="m18 85 35 2 5 18-40 3Z" fill="#b9b4987a" />
        <text
          x="36"
          y="100"
          textAnchor="middle"
          fontSize="9"
          fill="#4e6653"
          fontFamily="monospace"
        >
          NƯỚC
        </text>
      </svg>
      <div className="footprints" aria-hidden="true">
        <i />
        <i />
      </div>
    </>
  )
}
