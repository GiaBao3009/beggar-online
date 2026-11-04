import { useEffect, useRef, useState } from "react"
import Beggar, { type Mood } from "./Beggar"
import { Icon } from "./Icons"
import StreetProps from "./StreetProps"
import qrDonate from "./assets/qr-donate.png"

const amounts = [
  { value: 5000, label: "Gói mì cứu đói", note: "Sống qua hôm nay" },
  { value: 10000, label: "Ly trà đá", note: "Ấm lòng một chút" },
  { value: 20000, label: "Hộp cơm bình dân", note: "Một bữa no bụng" },
  { value: 50000, label: "Ông được ăn sang", note: "Có cả miếng thịt!" },
  { value: 100000, label: "Đại gia vỉa hè", note: "Ông nhận con nuôi" },
]
const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ"
const phrases = [
  "Con ơi, ông thấy con có vẻ tốt bụng...",
  "Ông hứa không xin nữa... ngày mai.",
  "Đừng lướt mà con ơi!",
  "Chuyển khoản đi, ông có QR rồi!",
]
const originalLeaders = [
  { name: "Đại gia giấu tên", amount: 100000, message: "“Ăn ngon nha ông!”" },
  { name: "Người qua đường", amount: 50000, message: "“Của ít lòng nhiều.”" },
  { name: "Bé Mì Tôm", amount: 20000, message: "“Ông nhớ ăn cơm đó.”" },
]

function QRDemo() {
  return (
    <svg
      viewBox="0 0 29 29"
      aria-label="Hình minh họa QR, không dùng để thanh toán"
      role="img"
    >
      <rect width="29" height="29" fill="#e9e4d5" />
      {Array.from({ length: 25 * 25 }, (_, i) => {
        const x = i % 25,
          y = Math.floor(i / 25)
        const finder = (ox: number, oy: number) =>
          x >= ox && x < ox + 7 && y >= oy && y < oy + 7
        if (finder(0, 0) || finder(18, 0) || finder(0, 18)) return null
        return (x * 13 + y * 7 + x * y) % 11 < 5 ? (
          <rect
            key={i}
            x={x + 2}
            y={y + 2}
            width="1"
            height="1"
            fill="#27271f"
          />
        ) : null
      })}
      {[
        [2, 2],
        [20, 2],
        [2, 20],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#27271f" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#e9e4d5" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#27271f" />
        </g>
      ))}
      <rect x="9" y="12" width="13" height="5" fill="#e9e4d5" />
      <text
        x="15.5"
        y="15.4"
        textAnchor="middle"
        fontSize="3"
        fontFamily="monospace"
        fontWeight="bold"
        fill="#a83224"
      >
        DEMO
      </text>
    </svg>
  )
}

export default function App() {
  const [mood, setMood] = useState<Mood>("wave")
  const [speech, setSpeech] = useState(phrases[0])
  const [selected, setSelected] = useState(20000)
  const [custom, setCustom] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [total, setTotal] = useState(25000)
  const [people, setPeople] = useState(12)
  const [receipt, setReceipt] = useState<{
    amount: number
    name: string
    time: string
  } | null>(null)
  const [leaders, setLeaders] = useState(originalLeaders)
  const [sound, setSound] = useState(false)
  const [notification, setNotification] = useState(false)
  const [reaction, setReaction] = useState("Vẫy tay chào con")
  const modalRef = useRef<HTMLDialogElement>(null)
  const donateRef = useRef<HTMLButtonElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const speechTimer = useRef<number | null>(null)

  function resetSpeechTimer() {
    if (speechTimer.current) window.clearInterval(speechTimer.current)
    speechTimer.current = window.setInterval(
      () => setSpeech(phrases[Math.floor(Math.random() * phrases.length)]),
      15000,
    )
  }

  useEffect(() => {
    resetSpeechTimer()
    return () => {
      if (speechTimer.current) window.clearInterval(speechTimer.current)
      audio.current?.close()
    }
  }, [])
  useEffect(() => {
    if (receipt) modalRef.current?.showModal()
  }, [receipt])
  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(false), 5000)
    return () => window.clearTimeout(timer)
  }, [notification])
  // Phát âm thanh cảm xúc phong phú tương ứng với từng trạng thái
  function playEmotionSound(
    type: "happy" | "sad" | "rich" | "wave" | "coin",
  ) {
    if (!sound) return
    const ctx = audio.current || (audio.current = new AudioContext())
    void ctx.resume()
    const now = ctx.currentTime

    if (type === "sad") {
      // Âm thanh trầm buồn nấc nghẹn khi khóc
      ;[392, 349, 311].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + i * 0.22)
        osc.frequency.linearRampToValueAtTime(freq - 18, now + i * 0.22 + 0.35)
        gain.gain.setValueAtTime(0.045, now + i * 0.22)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.38)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.22)
        osc.stop(now + i * 0.22 + 0.4)
      })
    } else if (type === "happy") {
      // Âm thanh rộn ràng cười khà khà (4 nốt arpeggio vui vẻ)
      ;[523, 659, 784, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, now + i * 0.08)
        gain.gain.setValueAtTime(0.055, now + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.16)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.08)
        osc.stop(now + i * 0.08 + 0.18)
      })
    } else if (type === "coin") {
      // Tiếng kim loại leng keng khi gõ vào ca/bát xin tiền
      ;[2200, 4400].forEach((freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.35)
      })
    } else if (type === "rich") {
      // Fanfare bất ngờ khi nhận số tiền lớn
      ;[523, 659, 784, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.06, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.28)
      })
    } else {
      // Tiếng chuông chào hỏi thân thiện
      ;[523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.05, now + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.12)
        osc.stop(now + i * 0.12 + 0.4)
      })
    }
  }

  // Xử lý sự kiện khi người dùng tương tác trực tiếp lên mô hình 3D của ông
  function handleBeggarInteract(type: "head" | "body" | "bowl") {
    resetSpeechTimer()
    if (type === "head") {
      // Chạm vào đầu/mặt: Ông cười tít mắt vì nhột
      setMood("happy")
      setSpeech("Ha ha! Nhột quá con ơi! Nhưng ông vui lắm! 😂")
      setReaction("Ông cười rạng rỡ vì nhột")
      playEmotionSound("happy")
    } else if (type === "bowl") {
      // Chạm vào chiếc ca / bát tiền: Nghe tiếng đồng xu leng keng
      setSpeech("Leng keng! Cảm ơn con đã gõ vào chiếc ca yêu thương!")
      setReaction("Nghe tiếng đồng xu rơi")
      playEmotionSound("coin")
    } else {
      // Chạm vào thân mình ông: Đổi cảm xúc tương tác
      if (mood === "sad") {
        setMood("happy")
        setSpeech("Có con chạm an ủi là ông hết buồn rồi nè!")
        setReaction("Ông lau nước mắt cười tươi")
        playEmotionSound("happy")
      } else {
        setMood("excited")
        setSpeech("Ông nghe rồi con ơi! Ông vẫn ở ngay đây!")
        setReaction("Ông hào hứng quay sang")
        playEmotionSound("wave")
      }
    }
  }

  function select(value: number) {
    resetSpeechTimer()
    setSelected(value)
    setCustom("")
    setError("")
    setMood(value >= 100000 ? "rich" : "happy")
    setSpeech(
      value >= 100000
        ? "TRỜI ƠI! ĐẠI GIA! Ông nhận con làm con nuôi!"
        : value === 5000
          ? "5K cũng quý, ông cảm ơn con nha!"
          : "Có cơm ăn rồi! Con đúng là người tốt bụng.",
    )
    playEmotionSound(value >= 100000 ? "rich" : "happy")
  }

  function cry() {
    resetSpeechTimer()
    setMood("sad")
    setSpeech("Không sao đâu con... ông ngồi đợi thêm chút nữa... đói 3 ngày rồi...")
    setReaction("Ông buồn khóc ròng ròng")
    playEmotionSound("sad")
  }
  function donate() {
    const value = custom ? Number(custom) : selected
    if (
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 1000 ||
      value > 100000000
    ) {
      setError("Con nhập từ 1.000đ đến 100.000.000đ nhé.")
      return
    }
    const donor = name.trim() || "Người tốt bụng"
    setReceipt({
      amount: value,
      name: donor,
      time: new Date().toLocaleString("vi-VN"),
    })
    setTotal((v) => v + value)
    setPeople((v) => v + 1)
    setLeaders((v) =>
      [
        ...v,
        { name: donor, amount: value, message: "“Một tấm lòng, một bữa no.”" },
      ]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    )
    setMood(value >= 100000 ? "rich" : "happy")
    setSpeech("Ông cảm ơn con nhiều! Chúc con luôn no bụng!")
    setNotification(true)
    playEmotionSound(value >= 100000 ? "rich" : "happy")
  }
  function closeReceipt() {
    modalRef.current?.close()
    setReceipt(null)
    donateRef.current?.focus()
  }
  return (
    <div className="street">
      <header className="header">
        <a className="brand" href="#" aria-label="Xin Đi Bro, về đầu trang">
          XIN ĐI <span>BRO</span>
          <i>®</i>
          <small>ĂN XIN THỜI ĐẠI 4.0</small>
        </a>
        <nav aria-label="Điều hướng chính">
          <a href="#goc-via-he">GÓC VỈA HÈ</a>
          <a href="#chiec-ca">CHIẾC CA CỦA ÔNG</a>
          <a href="#bang-vang">SỔ VÀNG TẤM LÒNG</a>
        </nav>
        <button
          className="sound-button"
          onClick={() => {
            setSound(!sound)
            if (!sound) {
              setSpeech("Bật tiếng rồi! Chọn một món để nghe tiếng vui nha.")
            }
          }}
          aria-pressed={sound}
        >
          <Icon name={sound ? "sound" : "mute"} size={17} />
          <span>ÂM THANH: {sound ? "BẬT" : "TẮT"}</span>
        </button>
      </header>

      <main>
        <section className="hero" id="goc-via-he">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> TRỰC TIẾP TỪ MỘT GÓC VỈA HÈ{" "}
              <span className="location">10.7769° N</span>
            </div>
            <div className="small-graffiti">
              Người ta có startup.
              <br />
              Ông có cái ca.
            </div>
            <h1>
              CON ƠI...
              <br />
              <span>CỨU ÔNG</span>
              <br />
              <span className="last-line">
                VỚI!
                <svg viewBox="0 0 230 25" aria-hidden="true">
                  <path d="M4 18 Q110 -1 225 9M8 24Q100 5 207 16" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">
              Ông không cần nhiều đâu. Chỉ cần con
              <br className="desktop-break" /> chuyển khoản là ông vui rồi.
            </p>
            <div className="hero-actions">
              <a
                className="primary-button"
                href="#chiec-ca"
                onMouseEnter={() => setMood("excited")}
              >
                <Icon name="heart" />
                THƯƠNG ÔNG THÌ BẤM ĐÂY
                <Icon name="arrow" />
              </a>
              <button className="cry-button" onClick={cry}>
                KHÔNG CÓ TIỀN À? <span>XEM ÔNG KHÓC</span> ↗
              </button>
            </div>
            <div className="hero-footnote">
              <span>100% lòng thành.</span> 0% hoàn tiền. Ông tiêu hết rồi.
            </div>
          </div>

          {/* Khối khung cảnh vỉa hè chứa mô hình 3D của ông */}
          <div className="hero-scene">
            {/* Vầng sáng phía sau ông */}
            <div className="scene-halo" />

            {/* Dòng chữ viết vẽ trên tường */}
            <div className="wall-writing">
              ĐỜI LÀ BỂ KHỔ
              <br />
              <span>qua đây đỡ ông</span>
            </div>

            {/* Bong bóng lời nói của ông */}
            <div className="speech-bubble" aria-live="polite">
              {speech}
              <span className="speech-scribble">ÔNG NÓI THIỆT ĐÓ</span>
            </div>

            {/* Thanh công cụ cảm xúc theo số tiền: Tiền vào là cười, bỏ đi là khóc */}
            <div className="hero-emotion-toolbar" aria-label="Biểu cảm theo số tiền">
              <button
                type="button"
                className={`emotion-pill ${mood === "sad" ? "active" : ""}`}
                onClick={() => {
                  resetSpeechTimer()
                  setMood("sad")
                  setSpeech("Hức hức... con đi thật sao... đói 3 ngày rồi mà không ai thương...")
                  setReaction("Bỏ đi 0đ: Ông khóc ròng ròng")
                  playEmotionSound("sad")
                }}
              >
                0Đ - BỎ ĐI (KHÓC)
              </button>
              <button
                type="button"
                className={`emotion-pill ${mood === "happy" && selected === 5000 && !custom ? "active" : ""}`}
                onClick={() => {
                  select(5000)
                  resetSpeechTimer()
                  setReaction("Cho 5K: Ông cười cảm ơn")
                }}
              >
                5K - CỨU ĐÓI (CƯỜI)
              </button>
              <button
                type="button"
                className={`emotion-pill ${mood === "happy" && selected === 20000 && !custom ? "active" : ""}`}
                onClick={() => {
                  select(20000)
                  resetSpeechTimer()
                  setReaction("Cho 20K: Ông cười tươi no bụng")
                }}
              >
                20K - BỮA NO (CƯỜI)
              </button>
              <button
                type="button"
                className={`emotion-pill ${mood === "rich" ? "active" : ""}`}
                onClick={() => {
                  select(100000)
                  resetSpeechTimer()
                  setReaction("Đại gia 100K: Ông hết hồn")
                }}
              >
                100K - ĐẠI GIA (HẾT HỒN)
              </button>
              <button
                type="button"
                className={`emotion-pill ${mood === "wave" ? "active" : ""}`}
                onClick={() => {
                  resetSpeechTimer()
                  setMood("wave")
                  setSpeech("Chào con! Chúc con một ngày an lành vạn sự như ý!")
                  setReaction("Vẫy tay chào con")
                  playEmotionSound("wave")
                }}
              >
                VẪY TAY CHÀO
              </button>
            </div>

            {/* Canvas 3D Three.js mô hình ông già vỉa hè */}
            <Beggar mood={mood} onInteract={handleBeggarInteract} />

            {/* Bảng xin tiền bên trái */}
            <div className="cardboard-sign sign-left">
              <span>CHO ÔNG XIN</span>
              <strong>ÍT TIỀN...</strong>
              <small>
                5K CŨNG ĐƯỢC,
                <br />
                ÔNG KHÔNG CHÊ
              </small>
            </div>

            {/* Bảng đói 3 ngày bên phải */}
            <div className="cardboard-sign sign-right">
              ĐÓI 3 NGÀY
              <br />
              RỒI CON ƠI <span className="sign-face">:’(</span>
            </div>

            {/* Nhãn mũi tên chỉ vào chiếc ca */}
            <div className="bowl-label">
              thả chút yêu thương <span>↙</span>
            </div>

            {/* Tờ báo vỉa hè trang trí */}
            <div className="newspaper">
              <b>TIN VỈA HÈ</b>
              <span>
                GIÁ CƠM TĂNG.
                <br />
                LÒNG TỐT THÌ KHÔNG.
              </span>
              <div />
            </div>

            {/* Mẩu thuốc lá trang trí */}
            <div className="cigarette" />
            <div className="cigarette cigarette-two" />

            {/* Đạo cụ vỉa hè (chai nước, radio cũ) */}
            <StreetProps />

            {/* Chú thích trạng thái dưới cùng */}
            <div className="scene-caption">
              <span className="live-dot" /> ÔNG VẪN Ở ĐÂY. ÔNG CHƯA ĐI ĐÂU.
            </div>
          </div>
          <div className="status-board">
            <div className="status-title">
              <Icon name="cup" size={30} />
              <span>
                TÌNH HÌNH
                <br />
                <b>CHIẾC CA HÔM NAY</b>
              </span>
            </div>
            <div className="stat">
              <span>HÔM NAY XIN ĐƯỢC</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="stat">
              <span>SỐ NGƯỜI THƯƠNG ÔNG</span>
              <strong>
                {people}
                <small> người tốt</small>
              </strong>
            </div>
            <div className="goal">
              <div>
                <span>MỤC TIÊU: 100.000đ</span>
                <b>{Math.round(total / 1000)}%</b>
              </div>
              <div className="progress">
                <i style={{ width: `${Math.min(total / 1000, 100)}%` }} />
              </div>
              <small>
                {total >= 100000
                  ? "Hôm nay ông được ăn no rồi!"
                  : "Còn một chút nữa là ông được ăn no."}
              </small>
            </div>
          </div>
          <span className="hero-side-note">SCROLL XUỐNG ĐI CON ↓</span>
        </section>

        <div className="ticker">
          <div>
            {[0, 1, 2, 3].map((n) => (
              <span key={n}>
                <b>TIN NÓNG</b> ÔNG GIÀ VẪN CHƯA CÓ TIỀN ĂN SÁNG. <i>✳</i> LÒNG
                TỐT KHÔNG MẤT PHÍ. CHUYỂN KHOẢN THÌ CÓ. <i>✳</i>{" "}
              </span>
            ))}
          </div>
        </div>

        <section className="donation-section section-wrap" id="chiec-ca">
          <div className="section-heading">
            <div>
              <span className="section-number">01 / CHIẾC CA XIN TIỀN</span>
              <h2>
                GIÚP ÔNG MỘT
                <br />
                <span>BỮA CƠM NHÉ...</span>
              </h2>
            </div>
            <p>
              Không cần giải cứu thế giới.
              <br />
              Giải cứu chiếc bụng này trước đã.
              <span className="hand-arrow">↙</span>
            </p>
          </div>
          <div className="donation-card">
            <span className="tape tape-top" />
            <span className="card-stamp">
              CỦA ÍT
              <br />
              LÒNG NHIỀU
            </span>
            <div className="amount-area">
              <div className="step-label">
                <b>1</b> CON CHỌN MỘT CHÚT TẤM LÒNG
              </div>
              <div className="amount-grid">
                {amounts.map((a) => (
                  <button
                    key={a.value}
                    className={`amount-option ${
                      selected === a.value && !custom ? "selected" : ""
                    }`}
                    aria-pressed={selected === a.value && !custom}
                    onClick={() => select(a.value)}
                  >
                    <span className="amount-value">
                      {money(a.value)}
                      {selected === a.value && !custom && (
                        <Icon name="check" size={18} />
                      )}
                    </span>
                    <strong>{a.label}</strong>
                    <small>{a.note}</small>
                    {a.value === 20000 && (
                      <span className="popular-tag">VỪA ĐỦ NO</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="custom-line">
                <label htmlFor="custom">Hay con muốn cho ông nhiều hơn?</label>
                <div>
                  <input
                    id="custom"
                    type="number"
                    min="1000"
                    max="100000000"
                    step="1000"
                    placeholder="Số tiền tùy lòng con..."
                    value={custom}
                    onChange={(e) => {
                      setCustom(e.target.value)
                      setError("")
                    }}
                  />
                  <span>VNĐ</span>
                </div>
              </div>
              <div className="name-line">
                <label htmlFor="donor">
                  QUÝ DANH CỦA ÂN NHÂN <span>(không bắt buộc)</span>
                </label>
                <input
                  id="donor"
                  maxLength={40}
                  placeholder="Người tốt bụng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <p className="pencil-note">
                “5K cũng được. Ông không chê. Ông thề.”
              </p>
            </div>
            {/* Khu vực quét mã QR & xác nhận chuyển khoản */}
            <div className="payment-area">
              {/* Nhãn bước 2 */}
              <div className="step-label">
                <b>2</b> GỬI ÔNG CHÚT YÊU THƯƠNG
              </div>

              {/* Khung dán ảnh QR VietQR thực tế */}
              <div className="qr-frame">
                {/* Miếng băng dính giữ khung */}
                <span className="tape" />
                {/* Ảnh mã VietQR cứu đói IT */}
                <img
                  src={qrDonate}
                  alt="Mã QR VietQR chuyển khoản cứu đói IT"
                  className="w-full block bg-white p-1 rounded-sm shadow-inner"
                />
                <div>QUÉT LÀ ÔNG CƯỜI</div>
              </div>

              {/* Ghi chú hài hước dưới mã QR */}
              <p className="demo-note">
                QR VietQR chính chủ · Đời IT lương 4 triệu cứu đói khẩn cấp!
              </p>

              {/* Nút bấm tặng tiền */}
              <button
                ref={donateRef}
                className="primary-button donate-button"
                onClick={donate}
                onMouseEnter={() => {
                  setMood("excited")
                }}
              >
                <Icon name="heart" />
                <span>
                  TẶNG ÔNG {money(custom ? Number(custom) || 0 : selected)}
                </span>
                <Icon name="arrow" />
              </button>

              {/* Lời nhắn nhủ hài hước về đời IT */}
              <p className="payment-disclaimer">
                Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt.
                <br />
                Quét mã cứu đói hoặc bấm nút nhận hóa đơn tấm lòng!
              </p>
            </div>
          </div>
        </section>

        {/* Khối Section 02 - Cảm xúc của ông theo số tiền */}
        <section className="reaction-section section-wrap" id="chuyen-cua-ong">
          {/* Header giới thiệu cảm xúc theo số tiền */}
          <div className="reaction-intro">
            <span className="section-number">02 / ÔNG CŨNG CÓ CẢM XÚC</span>
            <h2>
              TIỀN VÀO LÀ CƯỜI.
              <br />
              <span>BỎ ĐI LÀ KHÓC.</span>
            </h2>
            <p>
              Không có kịch bản. Cảm xúc đi theo từng đồng con cho.
              <br />
              Thử bấm các mức tiền hoặc quay lưng đi xem ông diễn nhé!
            </p>
            <div className="reaction-live" aria-live="polite">
              <span className="live-dot" /> {reaction}
            </div>
            <a
              className="watch-reaction cursor-pointer"
              href="#goc-via-he"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("goc-via-he")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              XEM ÔNG DIỄN NGAY ↑
            </a>
          </div>

          {/* Lưới các thẻ phản ứng cảm xúc theo tiền */}
          <div className="reaction-notes">
            {[
              {
                title: "0Đ: BỎ ĐI THẬT À...",
                subtitle: "Không cho tiền - Ông khóc nức nở, nước mắt ròng ròng",
                mood: "sad" as Mood,
                face: "( ._ . )",
                speech: "Hức hức... con đi thật sao... đói 3 ngày rồi mà không ai thương...",
                soundType: "sad" as const,
              },
              {
                title: "5.000Đ: 5K CŨNG QUÝ",
                subtitle: "Gói mì cứu đói - Ông cười vui mừng, cảm ơn con",
                mood: "happy" as Mood,
                face: "( ᵔ◡ᵔ )",
                speech: "5K cũng quý! Gói mì có chủ rồi, ông cảm ơn con nhiều nha!",
                soundType: "happy" as const,
              },
              {
                title: "20.000Đ: CƠM BÌNH DÂN",
                subtitle: "Bữa no ấm bụng - Ông cười tươi roi rói khà khà",
                mood: "happy" as Mood,
                face: "( •‿• )",
                speech: "Ha ha! Có cơm ăn rồi! Con đúng là người tốt bụng cứu đói ông!",
                soundType: "happy" as const,
              },
              {
                title: "100.000Đ: ĐẠI GIA VỈA HÈ",
                subtitle: "Nhận con nuôi - Ông há hốc mồm hết hồn kinh ngạc",
                mood: "rich" as Mood,
                face: "( ◉O◉ )",
                speech: "TRỜI ĐẤT ƠI! ĐẠI GIA ĐÂY RỒI! Con nhận của ông một lạy!",
                soundType: "rich" as const,
              },
            ].map((r, i) => (
              <button
                type="button"
                className={`reaction-note note-${i} ${
                  mood === r.mood ? "active" : ""
                }`}
                key={r.title}
                onClick={() => {
                  resetSpeechTimer()
                  setMood(r.mood)
                  setSpeech(r.speech)
                  setReaction(r.title)
                  playEmotionSound(r.soundType)
                  // Tự động cuộn mượt lên trên để người dùng thấy ông diễn ngay
                  document.getElementById("goc-via-he")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <span className="tape" />
                <span className="drawn-face">{r.face}</span>
                <b>{r.title}</b>
                <small>{r.subtitle}</small>
                <span className="note-corner">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="leaderboard-section section-wrap" id="bang-vang">
          <div className="section-heading">
            <div>
              <span className="section-number">03 / SỔ VÀNG TẤM LÒNG</span>
              <h2>
                NGƯỜI TỐT.
                <br />
                <span>ÔNG NHỚ HẾT.</span>
              </h2>
            </div>
            <div className="good-person-stamp">
              CHỨNG NHẬN
              <br />
              <b>NGƯỜI TỐT</b>
              <br />
              BỞI ÔNG GIÀ VỈA HÈ
            </div>
          </div>
          <div className="leader-paper">
            <span className="tape" />
            <div className="leader-table-head">
              <span>THỨ HẠNG / ÂN NHÂN</span>
              <span>TẤM LÒNG</span>
            </div>
            {leaders.map((l, i) => (
              <div className="leader-row" key={`${l.name}-${i}`}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{l.name}</b>
                  <small>{l.message}</small>
                </div>
                <strong>{money(l.amount)}</strong>
                <Icon name="heart" size={18} />
              </div>
            ))}
            <div className="leader-bottom">
              <span>
                * Danh sách mô phỏng trong phiên này. Lòng tốt thì thật.
              </span>
              <a href="#chiec-ca">
                GHI TÊN CON VÀO ĐÂY <Icon name="arrow" size={16} />
              </a>
            </div>
          </div>
          <div className="receipt-teaser">
            <Icon name="print" size={29} />
            <div>
              <h3>MỖI TẤM LÒNG, MỘT CHIẾC HÓA ĐƠN.</h3>
              <p>Không được khấu trừ thuế. Nhưng được ông chúc phúc cả đời.</p>
            </div>
            <a href="#chiec-ca">LẤY HÓA ĐƠN CỦA CON ↗</a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-top">
          <a className="brand" href="#">
            XIN ĐI <span>BRO</span>
            <i>®</i>
          </a>
          <p>
            “Ông hứa không xin nữa...
            <br />
            <span>ngày mai.”</span>
          </p>
          <a className="back-top" href="#">
            LÊN ĐẦU TRANG ↑<small>Ông vẫn ngồi đó.</small>
          </a>
        </div>
        {/* Dòng ghi chú bản quyền và thông điệp hài hước đời IT */}
        <div className="footer-bottom">
          <span>© 2025 XIN ĐI BRO · MADE WITH ĐÓI & MỘT CHÚT HTML.</span>
          <span>
            Đời IT lương 4 triệu, tối về ôm laptop ra vỉa hè xin bát cơm chan nước mắt.
          </span>
          <span>VỈA HÈ KHÔNG NGỦ. CODE KHÔNG BUG (NÓI PHÉT).</span>
        </div>
      </footer>
      {notification && (
        <div className="notification" role="status">
          <Icon name="heart" />
          <div>
            <b>CHIẾC CA VỪA KÊU LENG KENG!</b>
            <span>Thêm một người tốt. Ông bớt đói một chút.</span>
          </div>
          <button
            onClick={() => setNotification(false)}
            aria-label="Đóng thông báo"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={modalRef}
        className="receipt-dialog"
        aria-labelledby="receipt-title"
        onCancel={(e) => {
          e.preventDefault()
          closeReceipt()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeReceipt()
        }}
      >
        {receipt && (
          <div className="receipt">
            <span className="tape" />
            <button
              className="receipt-close"
              onClick={closeReceipt}
              aria-label="Đóng hóa đơn"
            >
              <Icon name="close" />
            </button>
            <Icon name="cup" size={35} />
            <h2>XIN ĐI BRO</h2>
            <p>
              CHI NHÁNH: GÓC VỈA HÈ
              <br />
              MỞ CỬA: KHI NÀO CŨNG ĐÓI
            </p>
            <div className="receipt-rule" />
            <h3 id="receipt-title">HÓA ĐƠN TẤM LÒNG</h3>
            <p className="receipt-time">{receipt.time}</p>
            <dl>
              <div>
                <dt>Người ủng hộ:</dt>
                <dd>{receipt.name}</dd>
              </div>
              <div>
                <dt>Số tiền:</dt>
                <dd>
                  <b>{money(receipt.amount)}</b>
                </dd>
              </div>
              <div>
                <dt>Mục đích:</dt>
                <dd>Cứu đói ông già</dd>
              </div>
              <div>
                <dt>Trạng thái:</dt>
                <dd className="demo-status">DEMO · KHÔNG THU TIỀN</dd>
              </div>
            </dl>
            <div className="receipt-rule" />
            <h3>ÔNG CẢM ƠN CON NHIỀU!</h3>
            <p>
              CHÚC CON ĂN NGON,
              <br />
              NGỦ NGON, GIÀU CÓ!
            </p>
            <p className="signature">
              Ký tên:
              <br />
              <span>Ông già vỉa hè</span>
              <Icon name="heart" size={15} />
            </p>
            <div className="barcode" aria-hidden="true" />
            <small>BIÊN NHẬN TÌNH CẢM · KHÔNG CÓ GIÁ TRỊ THANH TOÁN</small>
            <button className="print-receipt" onClick={() => window.print()}>
              <Icon name="print" size={16} /> IN HÓA ĐƠN
            </button>
            <button className="receipt-return" onClick={closeReceipt}>
              VỀ VỈA HÈ CÙNG ÔNG ↗
            </button>
          </div>
        )}
      </dialog>
    </div>
  )
}
