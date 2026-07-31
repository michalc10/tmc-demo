"use client";

import { useEffect, useRef, useState } from "react";

type TextSize = "100" | "125" | "150";
type SoundMotionMode = "waves" | "speech" | "spectrum";

type SoundParticle = {
  offset: number;
  band: number;
  speed: number;
  phase: number;
};

const textSizes: { value: TextSize; label: string; shortLabel: string }[] = [
  { value: "100", label: "Zwykły tekst", shortLabel: "A" },
  { value: "125", label: "Większy tekst: 125%", shortLabel: "A+" },
  { value: "150", label: "Duży tekst: 150%", shortLabel: "A++" },
];

const services = [
  {
    number: "01",
    title: "Badanie słuchu",
    description: "Sprawdzimy Twój słuch i spokojnie wyjaśnimy wynik badania.",
    link: "#pierwsza-wizyta",
    action: "Jak wygląda wizyta",
  },
  {
    number: "02",
    title: "Dobór aparatów",
    description: "Dobierzemy rozwiązanie do Twojego słuchu, codziennych potrzeb i możliwości.",
    link: "#aparaty",
    action: "Poznaj możliwości",
  },
  {
    number: "03",
    title: "Serwis aparatów",
    description: "Serwisujemy aparaty zauszne i wewnątrzuszne oraz pomagamy w ich obsłudze.",
    link: "#serwis",
    action: "Skontaktuj się",
  },
  {
    number: "04",
    title: "Dofinansowanie NFZ",
    description: "Wyjaśnimy, jak skorzystać z dofinansowania na aparat słuchowy.",
    link: "#dofinansowanie",
    action: "Sprawdź informacje",
  },
] as const;

const steps = [
  {
    number: "1",
    title: "Najpierw porozmawiamy",
    description: "Powiesz nam, w jakich sytuacjach słyszenie sprawia Ci największą trudność. Jeśli chcesz przyjść z bliską osobą, wspomnij o tym przy ustalaniu terminu.",
  },
  {
    number: "2",
    title: "Sprawdzimy Twój słuch",
    description: "Wykonamy badanie w gabinecie, a następnie pokażemy i omówimy jego wynik prostym językiem.",
  },
  {
    number: "3",
    title: "Wspólnie wybierzemy następny krok",
    description: "Jeżeli będzie taka potrzeba, przedstawimy dostępne rozwiązania. Na każde pytanie znajdzie się czas.",
  },
] as const;

const brands = ["OTICON", "PHONAK", "AUDIO SERVICE", "WIDEX", "STARKEY"] as const;

const customerReviews = [
  "Moja mama korzysta z ich usług ponad 20 lat. Zawsze profesjonalni i uczciwi.",
  "Niezwykła cierpliwość Pana Mirosława. Profesjonalna i rzeczowa obsługa pacjentów od wielu lat.",
  "Doskonali fachowcy. Oferują bardzo dobry sprzęt.",
  "Bardzo fachowa i sympatyczna obsługa, szczególnie przez Pana Roberta. Korzystam od 20 lat. Serdecznie polecam.",
  "Od dziecka korzystam z usług TMC. Pan Robert to profesjonalista z anielską cierpliwością i indywidualnym podejściem, pełnym empatii i zrozumienia, za co jestem ogromnie wdzięczna. Nie ma słów, którymi można opisać, jak dobry jest w swoim fachu, bo słów by zabrakło. Usługi na najwyższym poziomie. Polecam wszystkim z całego serca.",
  "Moja mama zgłosiła się do nich, gdy miałam 4 lata, i nadal korzystam z ich usług, będąc już dorosłą osobą. Są profesjonalni, świetnie dopasują aparaty do potrzeb i wygody klienta. Jak dla mnie są niezastąpieni. Pozdrawiam.",
  "Profesjonalne doradztwo. Wysoka kultura. Polecam.",
] as const;

const soundMotionModes: { id: SoundMotionMode; label: string; description: string }[] = [
  { id: "waves", label: "Fale", description: "Fale dźwięku podążające za kursorem" },
  { id: "speech", label: "Rozmowa", description: "Strumień mowy skupiający się przy kursorze" },
  { id: "spectrum", label: "Widmo", description: "Widmo dźwięku reagujące na ruch kursora" },
];

function TmcSoundField({ mode, highContrast }: { mode: SoundMotionMode; highContrast: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !stage || !context) return;

    const canvasElement: HTMLCanvasElement = canvas;
    const drawingContext: CanvasRenderingContext2D = context;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    const source = { x: 0, y: 0 };
    let width = 1;
    let height = 1;
    let frame = 0;
    let running = false;
    let visible = true;
    let particles: SoundParticle[] = [];

    const palette = highContrast
      ? { primary: "255, 219, 0", secondary: "255, 255, 255", soft: "255, 255, 255" }
      : { primary: "206, 92, 62", secondary: "251, 249, 243", soft: "23, 93, 96" };

    function resize() {
      const bounds = canvasElement.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvasElement.width = Math.round(width * ratio);
      canvasElement.height = Math.round(height * ratio);
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      pointer.x = width * .5;
      pointer.y = height * .45;
      source.x = pointer.x;
      source.y = pointer.y;
      particles = Array.from({ length: width < 520 ? 34 : 52 }, (_, index) => ({
        offset: ((index * 83.37) % 1000) / 1000,
        band: index % 8,
        speed: .68 + (index % 6) * .09,
        phase: index * .77,
      }));
      if (reducedMotion) draw(0);
    }

    function updateSource(time: number) {
      const idleX = width * .5 + Math.cos(time * .00045) * width * .08;
      const idleY = height * .45 + Math.sin(time * .0006) * height * .06;
      const targetX = pointer.active ? pointer.x : idleX;
      const targetY = pointer.active ? pointer.y : idleY;
      source.x += (targetX - source.x) * .09;
      source.y += (targetY - source.y) * .09;
    }

    function drawWaves(time: number) {
      const maxRadius = Math.hypot(width, height) * .72;
      drawingContext.save();
      drawingContext.globalCompositeOperation = highContrast ? "source-over" : "screen";

      for (let index = 0; index < 7; index += 1) {
        const radius = ((time * .05 + index * (maxRadius / 6.2)) % maxRadius) + 10;
        const alpha = Math.max(0, 1 - radius / maxRadius) * (index % 2 === 0 ? .44 : .26);
        drawingContext.beginPath();
        drawingContext.arc(source.x, source.y, radius, -.2, Math.PI * 1.72);
        drawingContext.strokeStyle = `rgba(${index % 2 === 0 ? palette.secondary : palette.primary}, ${alpha})`;
        drawingContext.lineWidth = index % 3 === 0 ? 2 : 1;
        drawingContext.stroke();
      }

      drawingContext.beginPath();
      drawingContext.arc(source.x, source.y, 8 + Math.sin(time * .003) * 2, 0, Math.PI * 2);
      drawingContext.fillStyle = `rgba(${palette.primary}, .92)`;
      drawingContext.shadowBlur = 22;
      drawingContext.shadowColor = `rgba(${palette.primary}, .72)`;
      drawingContext.fill();
      drawingContext.restore();
    }

    function drawSpeech(time: number) {
      drawingContext.save();
      drawingContext.globalCompositeOperation = highContrast ? "source-over" : "screen";

      particles.forEach((particle, index) => {
        const travel = (particle.offset + time * .000035 * particle.speed) % 1;
        let x = -35 + travel * (width + 70);
        let y = height * (.2 + particle.band * .075) + Math.sin(time * .0012 + particle.phase) * 10;
        const distance = Math.hypot(source.x - x, source.y - y);
        const pull = distance < 230 ? Math.pow(1 - distance / 230, 2) : 0;
        x += (source.x - x) * pull * .22;
        y += (source.y - y) * pull * .6;
        const alpha = .18 + pull * .62;
        const color = index % 4 === 0 ? palette.primary : palette.secondary;

        drawingContext.beginPath();
        drawingContext.moveTo(x - (8 + particle.speed * 7), y);
        drawingContext.lineTo(x, y);
        drawingContext.strokeStyle = `rgba(${color}, ${alpha * .58})`;
        drawingContext.lineWidth = pull > .25 ? 1.6 : .7;
        drawingContext.stroke();
        drawingContext.beginPath();
        drawingContext.arc(x, y, pull > .2 ? 2.4 : 1.35, 0, Math.PI * 2);
        drawingContext.fillStyle = `rgba(${color}, ${alpha})`;
        drawingContext.fill();
      });

      drawingContext.beginPath();
      drawingContext.arc(source.x, source.y, 52 + Math.sin(time * .002) * 6, 0, Math.PI * 2);
      drawingContext.strokeStyle = `rgba(${palette.primary}, .38)`;
      drawingContext.lineWidth = 1.5;
      drawingContext.stroke();
      drawingContext.restore();
    }

    function drawSpectrum(time: number) {
      const count = width < 520 ? 25 : 39;
      const usableWidth = width * .84;
      const startX = width * .08;
      const gap = usableWidth / count;
      const baseY = height * .72;
      drawingContext.save();
      drawingContext.globalCompositeOperation = highContrast ? "source-over" : "screen";

      for (let index = 0; index < count; index += 1) {
        const x = startX + index * gap;
        const distance = Math.abs(x - source.x);
        const influence = pointer.active ? Math.max(0, 1 - distance / (width * .25)) : .22;
        const rhythm = .5 + Math.sin(time * .0022 + index * .72) * .22 + Math.sin(time * .0011 + index * .27) * .16;
        const barHeight = Math.max(14, height * (.08 + rhythm * .18 + influence * .24));
        const gradient = drawingContext.createLinearGradient(0, baseY, 0, baseY - barHeight);
        gradient.addColorStop(0, `rgba(${palette.soft}, .16)`);
        gradient.addColorStop(.55, `rgba(${palette.secondary}, ${.2 + influence * .34})`);
        gradient.addColorStop(1, `rgba(${palette.primary}, ${.42 + influence * .5})`);
        drawingContext.fillStyle = gradient;
        drawingContext.fillRect(x, baseY - barHeight, Math.max(2, gap * .38), barHeight);
      }
      drawingContext.restore();
    }

    function draw(time: number) {
      drawingContext.clearRect(0, 0, width, height);
      updateSource(time);
      if (mode === "waves") drawWaves(time);
      if (mode === "speech") drawSpeech(time);
      if (mode === "spectrum") drawSpectrum(time);
    }

    function render(time: number) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      draw(time);
      frame = window.requestAnimationFrame(render);
    }

    function start() {
      if (reducedMotion || running || !visible || document.hidden) return;
      running = true;
      frame = window.requestAnimationFrame(render);
    }

    function stop() {
      if (frame) window.cancelAnimationFrame(frame);
      running = false;
    }

    function handlePointerMove(event: PointerEvent) {
      const bounds = canvasElement.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function handleVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });

    resizeObserver.observe(canvasElement);
    visibilityObserver.observe(canvasElement);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();
    if (reducedMotion) draw(0);
    else start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode, highContrast]);

  return <canvas className="tmc-sound-canvas" ref={canvasRef} aria-hidden="true" />;
}

export default function TmcPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState<TextSize>("100");
  const [highContrast, setHighContrast] = useState(false);
  const [soundMotion, setSoundMotion] = useState<SoundMotionMode>("waves");
  const [menuOpen, setMenuOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedSize = window.localStorage.getItem("tmc-text-size");
        if (textSizes.some((size) => size.value === savedSize)) {
          setTextSize(savedSize as TextSize);
        }
        setHighContrast(window.localStorage.getItem("tmc-high-contrast") === "true");
        const savedMotion = window.localStorage.getItem("tmc-sound-motion");
        if (soundMotionModes.some((motion) => motion.id === savedMotion)) {
          setSoundMotion(savedMotion as SoundMotionMode);
        }
      } catch {
        // Zablokowane preferencje nie mogą utrudnić wejścia na stronę.
      }
      setPreferencesLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-tmc-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("tmc-reveal-ready");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("tmc-in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("tmc-in-view");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function changeTextSize(size: TextSize) {
    setTextSize(size);
    try {
      window.localStorage.setItem("tmc-text-size", size);
    } catch {
      // Ustawienie pozostaje aktywne do końca bieżącej wizyty.
    }
  }

  function toggleContrast() {
    setHighContrast((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("tmc-high-contrast", String(next));
      } catch {
        // Ustawienie pozostaje aktywne do końca bieżącej wizyty.
      }
      return next;
    });
  }

  function changeSoundMotion(mode: SoundMotionMode) {
    setSoundMotion(mode);
    try {
      window.localStorage.setItem("tmc-sound-motion", mode);
    } catch {
      // Animacja pozostaje wybrana do końca bieżącej wizyty.
    }
  }

  function showReview(index: number) {
    setReviewIndex((index + customerReviews.length) % customerReviews.length);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div
      ref={pageRef}
      className={`tmc-page ${preferencesLoaded ? "tmc-preferences-ready" : ""}`}
      data-text-size={textSize}
      data-high-contrast={highContrast ? "true" : "false"}
    >
      <a className="tmc-skip-link" href="#tmc-main">Przejdź do głównej treści</a>

      <aside className="tmc-accessibility" aria-label="Ustawienia dostępności">
        <div className="tmc-accessibility-inner">
          <p>Ułatwienia czytania</p>
          <div className="tmc-text-controls" role="group" aria-label="Wybierz wielkość tekstu">
            <span aria-hidden="true">Rozmiar tekstu:</span>
            {textSizes.map((size) => (
              <button
                type="button"
                aria-label={size.label}
                aria-pressed={textSize === size.value}
                className={textSize === size.value ? "tmc-control-active" : ""}
                onClick={() => changeTextSize(size.value)}
                key={size.value}
              >
                {size.shortLabel}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`tmc-contrast-control ${highContrast ? "tmc-control-active" : ""}`}
            aria-pressed={highContrast}
            onClick={toggleContrast}
          >
            <span aria-hidden="true" /> Wysoki kontrast
          </button>
          <span className="tmc-setting-status" aria-live="polite">
            Tekst {textSize}%. {highContrast ? "Wysoki kontrast włączony." : ""}
          </span>
        </div>
      </aside>

      <header className="tmc-header">
        <div className="tmc-header-inner">
          <a className="tmc-logo" href="#start" aria-label="TMC Aparaty Słuchowe — początek strony">
            <span className="tmc-logo-mark">TMC</span>
            <span className="tmc-logo-copy">aparaty<br />słuchowe</span>
          </a>

          <nav className="tmc-desktop-nav" aria-label="Główna nawigacja">
            <a href="#pierwsza-wizyta">Badanie</a>
            <a href="#aparaty">Aparaty</a>
            <a href="#dofinansowanie">NFZ</a>
            <a href="#dojazd">Dojazd</a>
            <a href="#kontakt">Kontakt</a>
          </nav>

          <a className="tmc-header-phone" href="tel:+48857445534">
            <small>Zadzwoń i umów wizytę</small>
            <strong>85 744 55 34</strong>
          </a>

          <button
            className="tmc-menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="tmc-mobile-menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? "Zamknij" : "Menu"}<span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>

        <nav
          className={`tmc-mobile-menu ${menuOpen ? "tmc-mobile-menu-open" : ""}`}
          id="tmc-mobile-menu"
          aria-label="Nawigacja mobilna"
        >
          <a href="#pierwsza-wizyta" onClick={closeMenu}>Badanie</a>
          <a href="#aparaty" onClick={closeMenu}>Aparaty</a>
          <a href="#dofinansowanie" onClick={closeMenu}>NFZ</a>
          <a href="#serwis" onClick={closeMenu}>Serwis</a>
          <a href="#dojazd" onClick={closeMenu}>Dojazd</a>
          <a href="#kontakt" onClick={closeMenu}>Kontakt</a>
        </nav>
      </header>

      <main id="tmc-main">
        <section className="tmc-hero" id="start">
          <div className="tmc-hero-copy">
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Aparaty słuchowe w Białymstoku · od 1990 roku</p>
            <h1>Znów słyszeć<br /><em>to, co ważne.</em></h1>
            <p className="tmc-hero-lead">
              Pomożemy Ci sprawdzić słuch, zrozumieć wynik i wybrać rozwiązanie dopasowane do Twojego życia.
              Bez pośpiechu i bez trudnych słów.
            </p>
            <div className="tmc-hero-actions">
              <a className="tmc-button tmc-button-primary" href="tel:+48857445534">
                Umów badanie telefonicznie <span aria-hidden="true">→</span>
              </a>
              <a className="tmc-button tmc-button-secondary" href="#pierwsza-wizyta">
                Jak wygląda pierwsza wizyta
              </a>
            </div>
            <ul className="tmc-hero-assurances" aria-label="Najważniejsze informacje">
              <li><strong>Ponad 35 lat</strong><span>doświadczenia w protetyce słuchu</span></li>
              <li><strong>Białystok</strong><span>ul. Stołeczna 2</span></li>
              <li><strong>Dogodne terminy</strong><span>po uzgodnieniu także później i w sobotę</span></li>
            </ul>
          </div>

          <div className="tmc-hero-visual">
            <div className="tmc-sound-visual" data-motion-mode={soundMotion} aria-hidden="true">
              <TmcSoundField mode={soundMotion} highContrast={highContrast} />
              <span className="tmc-sound-ring tmc-ring-one" />
              <span className="tmc-sound-ring tmc-ring-two" />
              <span className="tmc-sound-ring tmc-ring-three" />
              <span className="tmc-sound-core"><i /><i /><i /></span>
              <div className="tmc-word tmc-word-one">Słyszeć</div>
              <div className="tmc-word tmc-word-two">Rozumieć</div>
              <div className="tmc-word tmc-word-three">Rozmawiać</div>
            </div>
            <div className="tmc-visual-note">
              <span>Tu zaczyna się lepsza rozmowa</span>
              <strong>Porusz kursorem po ilustracji</strong>
            </div>
            <div className="tmc-motion-picker">
              <div className="tmc-motion-label">
                <span>Dźwięk w ruchu</span>
                <strong>{soundMotionModes.findIndex((motion) => motion.id === soundMotion) + 1}/3</strong>
              </div>
              <div className="tmc-motion-options" role="tablist" aria-label="Wybierz animację związaną ze słuchem">
                {soundMotionModes.map((motion) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={soundMotion === motion.id}
                    aria-label={motion.description}
                    className={soundMotion === motion.id ? "tmc-motion-active" : ""}
                    onClick={() => changeSoundMotion(motion.id)}
                    key={motion.id}
                  >
                    {motion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tmc-help" aria-labelledby="tmc-help-title">
          <div className="tmc-section-heading" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> W czym możemy pomóc?</p>
            <h2 id="tmc-help-title">Wybierz sprawę,<br />z którą przychodzisz.</h2>
            <p>Nie musisz znać nazw badań ani modeli aparatów. Zacznij od swojej potrzeby.</p>
          </div>
          <div className="tmc-service-grid" data-tmc-reveal>
            {services.map((service) => (
              <a href={service.link} className="tmc-service-card" key={service.number}>
                <span className="tmc-service-number">{service.number}</span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                <strong>{service.action}<span aria-hidden="true"> →</span></strong>
              </a>
            ))}
          </div>
        </section>

        <section className="tmc-visit" id="pierwsza-wizyta" aria-labelledby="tmc-visit-title">
          <div className="tmc-visit-intro" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Pierwsza wizyta</p>
            <h2 id="tmc-visit-title">Spokojnie.<br /><em>Wszystko wyjaśnimy.</em></h2>
            <p>
              Problemy ze słuchem mogą pojawiać się stopniowo. Pierwsza rozmowa służy temu, by zrozumieć Twoją sytuację — nie musisz wcześniej niczego wiedzieć ani przygotowywać.
            </p>
            <a href="tel:+48857445534" className="tmc-inline-link">Zadzwoń: 85 744 55 34 <span aria-hidden="true">→</span></a>
          </div>
          <ol className="tmc-steps" data-tmc-reveal>
            {steps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="tmc-aids" id="aparaty" aria-labelledby="tmc-aids-title">
          <div className="tmc-aids-visual" aria-hidden="true" data-tmc-reveal>
            <div className="tmc-device tmc-device-one"><span /><i /></div>
            <div className="tmc-device tmc-device-two"><span /><i /></div>
            <div className="tmc-aids-caption"><span>Dobór do potrzeb</span><strong>nie do schematu</strong></div>
          </div>
          <div className="tmc-aids-copy" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Aparaty słuchowe</p>
            <h2 id="tmc-aids-title">Rozwiązanie dla Twojego słuchu i codzienności.</h2>
            <p>
              Dobry aparat słuchowy powinien odpowiadać nie tylko wynikowi badania. Liczy się także wygoda, sposób spędzania czasu, rozmowy z bliskimi i miejsca, w których najczęściej przebywasz.
            </p>
            <div className="tmc-aids-points">
              <div><span>01</span><p><strong>Wyjaśniamy różnice</strong> między dostępnymi rozwiązaniami prostym językiem.</p></div>
              <div><span>02</span><p><strong>Pomagamy po wyborze</strong> — TMC prowadzi także serwis aparatów.</p></div>
              <div><span>03</span><p><strong>Oferujemy systemy wspomagające słyszenie</strong> w różnych codziennych sytuacjach.</p></div>
            </div>
            <a className="tmc-button tmc-button-primary" href="#kontakt">Porozmawiaj ze specjalistą <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="tmc-brands" aria-label="Marki aparatów słuchowych dostępne w TMC" data-tmc-reveal>
          <p>Sprawdzeni producenci w ofercie TMC</p>
          <div>{brands.map((brand) => <span key={brand}>{brand}</span>)}</div>
        </section>

        <section className="tmc-funding" id="dofinansowanie" aria-labelledby="tmc-funding-title">
          <div className="tmc-funding-label" data-tmc-reveal><span>NFZ</span><small>Dofinansowanie<br />aparatów słuchowych</small></div>
          <div className="tmc-funding-copy" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Mniej formalności</p>
            <h2 id="tmc-funding-title">Pomożemy Ci przejść przez dofinansowanie.</h2>
            <p>
              TMC ma podpisaną umowę z Narodowym Funduszem Zdrowia i oferuje aparaty słuchowe z dofinansowaniem. Skontaktuj się z nami — wyjaśnimy, jakie dokumenty i kroki będą potrzebne w Twojej sytuacji.
            </p>
            <a className="tmc-button tmc-button-light" href="tel:+48857445534">Zapytaj o dofinansowanie <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="tmc-trust" id="serwis" aria-labelledby="tmc-trust-title">
          <div className="tmc-section-heading" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> TMC w Białymstoku</p>
            <h2 id="tmc-trust-title">Opieka, która nie kończy się po wyborze aparatu.</h2>
          </div>
          <div className="tmc-trust-grid" data-tmc-reveal>
            <article><strong>Od 1990</strong><h3>Lokalne doświadczenie</h3><p>Od ponad trzech dekad pomagamy osobom niedosłyszącym w Białymstoku.</p></article>
            <article><strong>Na miejscu</strong><h3>Serwis aparatów</h3><p>Serwisujemy aparaty zauszne i wewnątrzuszne oraz pomagamy rozwiązać problemy z obsługą.</p></article>
            <article><strong>Bez pośpiechu</strong><h3>Jasne wyjaśnienia</h3><p>Wynik i możliwe rozwiązania omawiamy tak, aby każda decyzja była zrozumiała.</p></article>
          </div>
        </section>

        <section className="tmc-reviews" aria-labelledby="tmc-reviews-title">
          <div className="tmc-reviews-heading" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Opinie klientów</p>
            <h2 id="tmc-reviews-title">Zaufanie budowane<br /><em>przez wiele lat.</em></h2>
          </div>
          <div
            className="tmc-review-carousel"
            aria-label="Karuzela opinii klientów"
            aria-roledescription="karuzela"
            data-tmc-reveal
          >
            <div className="tmc-review-viewport">
              <div className="tmc-review-measurer" aria-hidden="true">
                {customerReviews.map((review) => (
                  <blockquote className="tmc-review-card tmc-review-measure" key={`measure-${review}`}>
                    <div className="tmc-review-stars"><span>★★★★★</span></div>
                    <p>{review}</p>
                    <footer><span>Opinia klienta</span><strong>Google · 5/5</strong></footer>
                  </blockquote>
                ))}
              </div>
              <blockquote className="tmc-review-card" key={reviewIndex}>
                <div className="tmc-review-stars" aria-label="Ocena 5 na 5 gwiazdek"><span aria-hidden="true">★★★★★</span></div>
                <p>{customerReviews[reviewIndex]}</p>
                <footer><span>Opinia klienta</span><strong>Google · 5/5</strong></footer>
              </blockquote>
            </div>
            <div className="tmc-review-arrows">
              <button type="button" onClick={() => showReview(reviewIndex - 1)} aria-label="Pokaż poprzednią opinię"><span aria-hidden="true">←</span></button>
              <button type="button" onClick={() => showReview(reviewIndex + 1)} aria-label="Pokaż następną opinię"><span aria-hidden="true">→</span></button>
            </div>
          </div>
        </section>

        <section className="tmc-faq" aria-labelledby="tmc-faq-title">
          <div data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Najczęstsze pytania</p>
            <h2 id="tmc-faq-title">Dobrze wiedzieć przed wizytą.</h2>
            <p>Jeżeli nie znajdziesz tu odpowiedzi, zadzwoń. Chętnie wszystko wyjaśnimy.</p>
          </div>
          <div className="tmc-faq-list" data-tmc-reveal>
            <details>
              <summary>Jak umówić badanie słuchu?<span aria-hidden="true">+</span></summary>
              <p>Najprościej zadzwonić pod numer 85 744 55 34 lub 606 321 416. Wspólnie wybierzemy dogodny termin.</p>
            </details>
            <details>
              <summary>Czy mogę przyjść z bliską osobą?<span aria-hidden="true">+</span></summary>
              <p>Zapytaj o to podczas ustalania terminu. Obecność kogoś bliskiego może ułatwić rozmowę o sytuacjach, w których słyszenie sprawia największą trudność.</p>
            </details>
            <details>
              <summary>Czy TMC realizuje dofinansowanie NFZ?<span aria-hidden="true">+</span></summary>
              <p>Tak. TMC ma podpisaną umowę z NFZ i oferuje aparaty słuchowe z dofinansowaniem. Szczegóły zależą od indywidualnej sytuacji — wyjaśnimy je podczas kontaktu.</p>
            </details>
            <details>
              <summary>Czy mogę oddać aparat do serwisu?<span aria-hidden="true">+</span></summary>
              <p>Tak. TMC prowadzi serwis aparatów zausznych i wewnątrzusznych. Zadzwoń wcześniej, aby opisać problem.</p>
            </details>
          </div>
        </section>

        <section className="tmc-directions" id="dojazd" aria-labelledby="tmc-directions-title">
          <div className="tmc-directions-copy" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Dojazd krok po kroku</p>
            <h2 id="tmc-directions-title">Trafisz do nas<br /><em>bez zgadywania.</em></h2>
            <p>
              TMC mieści się przy ul. Stołecznej 2, w lokalu 103. Oficjalna informacja firmy potwierdza,
              że gabinet znajduje się na parterze.
            </p>
            <ol className="tmc-arrival-steps">
              <li><span>1</span><p><strong>Wejdź pod adres Stołeczna 2.</strong> Na miejscu szukaj lokalu numer 103.</p></li>
              <li><span>2</span><p><strong>Gabinet jest na parterze.</strong> Nie trzeba szukać windy ani wchodzić na wyższe piętro.</p></li>
              <li><span>3</span><p><strong>Potrzebujesz pomocy?</strong> Zadzwoń pod 85 744 55 34 i poproś o wskazówki dotyczące wejścia.</p></li>
            </ol>
          </div>
          <div className="tmc-map-card" data-tmc-reveal>
            <iframe
              title="Mapa dojazdu do TMC Aparaty Słuchowe przy ulicy Stołecznej 2 w Białymstoku"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2393.7273944173944!2d23.143805316529257!3d53.13303897993498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ffc120643c251%3A0xde9079384b85565c!2s%22TMC%22+APARATY+S%C5%81UCHOWE+s.c.!5e0!3m2!1spl!2spl!4v1535887497107"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="tmc-map-address">
              <span>Adres docelowy</span>
              <strong>ul. Stołeczna 2, lokal 103</strong>
              <p>15-879 Białystok · parter</p>
              <a href="https://www.google.com/maps/search/?api=1&query=TMC+Aparaty+S%C5%82uchowe+Sto%C5%82eczna+2+Bia%C5%82ystok" target="_blank" rel="noreferrer">Otwórz pełną mapę Google →</a>
            </div>
          </div>
        </section>

        <section className="tmc-contact" id="kontakt" aria-labelledby="tmc-contact-title">
          <div className="tmc-contact-main" data-tmc-reveal>
            <p className="tmc-eyebrow"><span aria-hidden="true" /> Kontakt</p>
            <h2 id="tmc-contact-title">Zrób pierwszy krok.<br /><em>Resztę wyjaśnimy razem.</em></h2>
            <p>Nie musisz wiedzieć, jakiego badania lub aparatu potrzebujesz. Opowiedz nam po prostu, co Cię niepokoi.</p>
            <div className="tmc-contact-actions">
              <a href="tel:+48857445534"><small>Telefon stacjonarny</small><strong>85 744 55 34</strong><span aria-hidden="true">→</span></a>
              <a href="tel:+48606321416"><small>Telefon komórkowy</small><strong>606 321 416</strong><span aria-hidden="true">→</span></a>
            </div>
            <a className="tmc-contact-email" href="mailto:biuro@tmc.pl">biuro@tmc.pl</a>
          </div>
          <div className="tmc-contact-details" data-tmc-reveal>
            <div>
              <span className="tmc-detail-label">Adres gabinetu</span>
              <address><strong>ul. Stołeczna 2, lokal 103</strong><br />15-879 Białystok<br /><em>Gabinet znajduje się na parterze.</em></address>
              <a href="https://www.google.com/maps/search/?api=1&query=Sto%C5%82eczna+2+Bia%C5%82ystok" target="_blank" rel="noreferrer">Pokaż dojazd na mapie →</a>
            </div>
            <div>
              <span className="tmc-detail-label">Godziny otwarcia</span>
              <dl>
                <div><dt>Poniedziałek</dt><dd>8:00–16:00</dd></div>
                <div><dt>Wtorek</dt><dd>8:00–16:00</dd></div>
                <div><dt>Środa</dt><dd>8:00–16:00</dd></div>
                <div><dt>Czwartek</dt><dd>8:00–17:00</dd></div>
                <div><dt>Piątek</dt><dd>8:00–16:00</dd></div>
              </dl>
              <p>Po uzgodnieniu możliwa jest wizyta w godzinach 16:00–19:00 oraz w sobotę.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="tmc-footer">
        <p className="demo-notice">Projekt koncepcyjny — nieoficjalna strona TMC.</p>
        <div className="tmc-footer-top">
          <a className="tmc-logo" href="#start" aria-label="TMC — wróć na początek">
            <span className="tmc-logo-mark">TMC</span>
            <span className="tmc-logo-copy">aparaty<br />słuchowe</span>
          </a>
          <p>Słyszeć. Rozumieć. Rozmawiać.</p>
          <a href="#start">Wróć na górę ↑</a>
        </div>
        <p className="tmc-medical-notice">
          To jest wyrób medyczny. Używaj go zgodnie z instrukcją używania lub etykietą.
        </p>
        <div className="tmc-footer-bottom"><span>© {new Date().getFullYear()} TMC Aparaty Słuchowe</span><span>Białystok · od 1990 roku</span></div>
      </footer>

      <nav className="tmc-mobile-contact" aria-label="Szybki kontakt">
        <a href="tel:+48857445534">Zadzwoń</a>
        <a href="#kontakt">Kontakt i dojazd</a>
      </nav>
    </div>
  );
}
