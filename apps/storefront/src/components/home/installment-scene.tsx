/**
 * The installment panel's illustration.
 *
 * Ported from the design canvas as vector, not rasterised: it is drawn entirely
 * from design-system colour tokens, so it re-tints with the palette (and with
 * the dark theme) instead of being a picture of one particular palette. It also
 * costs no network request and stays sharp at any density.
 *
 * It carries role="img" and a Persian label describing the scene, because the
 * scene is not purely ornamental — it is what tells a scanning customer that
 * this panel is about paying monthly.
 */
export function InstallmentScene() {
  return (
    <svg
      viewBox="0 0 390 168"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="مانکن جواهر روی پایه طلایی، سکه‌های اقساط ماهانه و تقویم ۳۶ ماهه"
    >
      <ellipse cx="300" cy="152" rx="88" ry="13" fill="var(--teal-800)" opacity=".10" />
      <ellipse cx="140" cy="156" rx="98" ry="11" fill="var(--teal-800)" opacity=".07" />

      <path d="M260 142v8a40 11 0 0 0 80 0v-8Z" fill="var(--gold-700)" />
      <ellipse cx="300" cy="142" rx="40" ry="11" fill="var(--gold-500)" />
      <path d="M274 135v5a26 8 0 0 0 52 0v-5Z" fill="var(--gold-600)" />
      <ellipse cx="300" cy="135" rx="26" ry="8" fill="var(--gold-400)" />
      <ellipse cx="300" cy="134" rx="14" ry="4" fill="var(--gold-300)" />

      <path d="M293 133c2-5 3-8 2-11h10c-1 3 0 6 2 11Z" fill="var(--gold-500)" />
      <path d="M299 122h3c-1 3 0 6 2 11h-3c-2-5-3-8-2-11Z" fill="var(--gold-400)" />
      <ellipse cx="300" cy="122" rx="16" ry="5" fill="var(--gold-400)" />
      <ellipse cx="300" cy="121" rx="9" ry="3" fill="var(--gold-300)" />

      <path
        d="M292 34C292 26 308 26 308 34C308 46 307 56 310 64C316 72 326 78 331 90C336 100 338 108 336 118H264C262 108 264 100 269 90C274 78 284 72 290 64C293 56 292 46 292 34Z"
        fill="var(--teal-600)"
      />
      <path
        d="M296 32c0-3 8-3 8 0v32c0 12 10 16 10 28v26h-28V92c0-12 10-16 10-28V32Z"
        fill="var(--teal-500)"
        opacity=".3"
      />
      <ellipse cx="300" cy="118" rx="36" ry="7" fill="var(--teal-500)" />
      <ellipse cx="300" cy="34" rx="8" ry="2.8" fill="var(--teal-500)" />

      <path d="M289 60v6a11 3.4 0 0 0 22 0v-6Z" fill="var(--gold-600)" />
      <ellipse cx="300" cy="60" rx="11" ry="3.4" fill="var(--gold-400)" />
      <ellipse cx="300" cy="59.4" rx="6.4" ry="1.9" fill="var(--gold-300)" />

      <path d="M290 70Q300 118 310 70L307 70Q300 111.5 293 70Z" fill="var(--gold-500)" />
      <g fill="var(--gold-400)">
        <circle cx="300" cy="94" r="2.5" />
        <circle cx="297.4" cy="92.4" r="2.4" />
        <circle cx="302.6" cy="92.4" r="2.4" />
        <circle cx="295" cy="88" r="2.3" />
        <circle cx="305" cy="88" r="2.3" />
        <circle cx="292.4" cy="80.1" r="2.1" />
        <circle cx="307.6" cy="80.1" r="2.1" />
        <circle cx="290.6" cy="72.6" r="1.9" />
        <circle cx="309.4" cy="72.6" r="1.9" />
      </g>
      <path d="M294 70Q300 100 306 70L303.5 70Q300 95 296.5 70Z" fill="var(--gold-500)" />
      <g fill="var(--gold-300)">
        <circle cx="300" cy="85" r="1.9" />
        <circle cx="297" cy="81.3" r="1.8" />
        <circle cx="303" cy="81.3" r="1.8" />
        <circle cx="295.2" cy="75.4" r="1.6" />
        <circle cx="304.8" cy="75.4" r="1.6" />
      </g>

      <ellipse cx="300" cy="95.5" rx="2.8" ry="2.3" fill="var(--gold-600)" />
      <circle cx="300" cy="104" r="8.4" fill="var(--gold-500)" />
      <circle cx="300" cy="104" r="6.2" fill="var(--gold-300)" />
      <circle cx="300" cy="104" r="2.4" fill="var(--gold-600)" />
      <g fill="var(--gold-100)">
        <circle cx="300" cy="99.6" r="0.8" />
        <circle cx="300" cy="108.4" r="0.8" />
        <circle cx="295.6" cy="104" r="0.8" />
        <circle cx="304.4" cy="104" r="0.8" />
      </g>

      <g>
        <path d="M96 140v6a24 8.5 0 0 0 48 0v-6Z" fill="var(--gold-700)" />
        <ellipse cx="120" cy="140" rx="24" ry="8.5" fill="var(--gold-500)" />
        <ellipse cx="120" cy="139" rx="13" ry="4.4" fill="var(--gold-300)" />
        <path d="M96 131v6a24 8.5 0 0 0 48 0v-6Z" fill="var(--gold-700)" />
        <ellipse cx="120" cy="131" rx="24" ry="8.5" fill="var(--gold-500)" />
        <ellipse cx="120" cy="130" rx="13" ry="4.4" fill="var(--gold-300)" />
        <path d="M96 122v6a24 8.5 0 0 0 48 0v-6Z" fill="var(--gold-700)" />
        <ellipse cx="120" cy="122" rx="24" ry="8.5" fill="var(--gold-500)" />
        <ellipse cx="120" cy="121" rx="13" ry="4.4" fill="var(--gold-300)" />
      </g>
      <g>
        <path d="M156 143v6a22 8 0 0 0 44 0v-6Z" fill="var(--gold-700)" />
        <ellipse cx="178" cy="143" rx="22" ry="8" fill="var(--gold-500)" />
        <ellipse cx="178" cy="142" rx="12" ry="4" fill="var(--gold-300)" />
        <path d="M156 134v6a22 8 0 0 0 44 0v-6Z" fill="var(--gold-700)" />
        <ellipse cx="178" cy="134" rx="22" ry="8" fill="var(--gold-500)" />
        <ellipse cx="178" cy="133" rx="12" ry="4" fill="var(--gold-300)" />
      </g>

      <path d="M50 78 108 106l58-28v8l-58 28-58-28Z" fill="var(--warm-200)" />
      <path d="M108 50 166 78l-58 28-58-28Z" fill="var(--white)" />
      <path d="M108 50 122 57 64 85 50 78Z" fill="var(--gold-400)" />
      <g fill="var(--gold-400)">
        <path d="M52.2 78 59.7 74.4 67.2 78 59.7 81.6Z" />
        <path d="M61.8 82.7 69.3 79.1 76.8 82.7 69.3 86.3Z" />
        <path d="M71.5 87.3 79 83.7 86.5 87.3 79 90.9Z" />
        <path d="M81.2 92 88.7 88.4 96.2 92 88.7 95.6Z" />
        <path d="M90.8 96.7 98.3 93.1 105.8 96.7 98.3 100.3Z" />
        <path d="M100.5 101.3 108 97.7 115.5 101.3 108 104.9Z" />
        <path d="M61.8 73.3 69.3 69.7 76.8 73.3 69.3 76.9Z" />
        <path d="M71.5 78 79 74.4 86.5 78 79 81.6Z" />
        <path d="M81.2 82.7 88.7 79.1 96.2 82.7 88.7 86.3Z" />
        <path d="M90.8 87.3 98.3 83.7 105.8 87.3 98.3 90.9Z" />
        <path d="M100.5 92 108 88.4 115.5 92 108 95.6Z" />
        <path d="M110.2 96.7 117.7 93.1 125.2 96.7 117.7 100.3Z" />
        <path d="M71.5 68.7 79 65.1 86.5 68.7 79 72.3Z" />
        <path d="M81.2 73.3 88.7 69.7 96.2 73.3 88.7 76.9Z" />
        <path d="M90.8 78 98.3 74.4 105.8 78 98.3 81.6Z" />
        <path d="M100.5 82.7 108 79.1 115.5 82.7 108 86.3Z" />
        <path d="M110.2 87.3 117.7 83.7 125.2 87.3 117.7 90.9Z" />
        <path d="M119.8 92 127.3 88.4 134.8 92 127.3 95.6Z" />
        <path d="M81.2 64 88.7 60.4 96.2 64 88.7 67.6Z" />
        <path d="M90.8 68.7 98.3 65.1 105.8 68.7 98.3 72.3Z" />
        <path d="M100.5 73.3 108 69.7 115.5 73.3 108 76.9Z" />
        <path d="M110.2 78 117.7 74.4 125.2 78 117.7 81.6Z" />
        <path d="M119.8 82.7 127.3 79.1 134.8 82.7 127.3 86.3Z" />
        <path d="M129.5 87.3 137 83.7 144.5 87.3 137 90.9Z" />
        <path d="M90.8 59.3 98.3 55.7 105.8 59.3 98.3 62.9Z" />
        <path d="M100.5 64 108 60.4 115.5 64 108 67.6Z" />
        <path d="M110.2 68.7 117.7 65.1 125.2 68.7 117.7 72.3Z" />
        <path d="M119.8 73.3 127.3 69.7 134.8 73.3 127.3 76.9Z" />
        <path d="M129.5 78 137 74.4 144.5 78 137 81.6Z" />
        <path d="M139.2 82.7 146.7 79.1 154.2 82.7 146.7 86.3Z" />
        <path d="M100.5 54.7 108 51.1 115.5 54.7 108 58.3Z" />
        <path d="M110.2 59.3 117.7 55.7 125.2 59.3 117.7 62.9Z" />
        <path d="M119.8 64 127.3 60.4 134.8 64 127.3 67.6Z" />
        <path d="M129.5 68.7 137 65.1 144.5 68.7 137 72.3Z" />
        <path d="M139.2 73.3 146.7 69.7 154.2 73.3 146.7 76.9Z" />
        <path d="M148.8 78 156.3 74.4 163.8 78 156.3 81.6Z" />
      </g>

      <circle cx="166" cy="48" r="18" fill="var(--teal-800)" />
      <text
        x="166"
        y="49"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="var(--gold-400)"
      >
        ۳۶
      </text>
      <text x="166" y="59" textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--teal-200)">
        قسط
      </text>
    </svg>
  );
}
