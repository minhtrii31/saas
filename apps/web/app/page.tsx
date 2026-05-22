import Link from "next/link";

const workflow = [
  {
    step: "01",
    label: "Upload",
    title: "Start from the real CV.",
    description:
      "Keep the source document visible, organized, and ready for repeat analysis.",
  },
  {
    step: "02",
    label: "Audit",
    title: "Turn weak signals into clear fixes.",
    description:
      "Score the CV, separate strengths from gaps, and explain why each issue matters.",
  },
  {
    step: "03",
    label: "Match",
    title: "Compare against the target role.",
    description:
      "Map matched skills, missing skills, and practical changes before applying.",
  },
];

const metrics = [
  ["MVP", "Focused CV workflow"],
  ["AI", "Provider-ready layer"],
  ["Output", "Structured guidance"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7f7f4] text-[#171717]">
      <header className="border-b border-[#171717]/10 px-6 py-5 md:px-12">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex max-w-screen-2xl items-center justify-between gap-6 text-[11px] font-bold uppercase tracking-[0.22em]"
        >
          <Link href="/" className="leading-none">
            Nyx
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <a href="#workflow" className="portfolio-link">
              Workflow
            </a>
            <a href="#principles" className="portfolio-link">
              Principles
            </a>
          </div>
          <Link href="/login" className="portfolio-link">
            Log in
          </Link>
        </nav>
      </header>

      <section className="px-6 pb-16 pt-12 md:px-12 md:pb-24 md:pt-16">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
              AI CV analysis workspace
            </p>
            <h1 className="max-w-[12ch] font-serif text-[clamp(4rem,14vw,13rem)] leading-[0.82] tracking-[-0.065em]">
              Sharper applications.
            </h1>
          </div>

          <div className="col-span-12 md:col-span-3">
            <p className="max-w-52 text-xs font-bold uppercase leading-snug tracking-[0.16em] text-[#6f6f68]">
              Built for focused job application decisions.
            </p>
          </div>

          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <p className="max-w-3xl text-2xl font-medium leading-tight md:text-4xl">
              A calm workspace for checking CV quality, matching role signals,
              and drafting better application material.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center bg-[#171717] px-5 text-sm font-bold text-white transition hover:bg-[#2b2926]"
              >
                Start workspace
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center border border-[#cfcfc8] bg-white px-5 text-sm font-bold text-[#171717] transition hover:bg-[#f1f1ee]"
              >
                Continue work
              </Link>
            </div>
          </div>

          <div className="col-span-12 mt-4 md:col-span-7">
            <ProductFrame />
          </div>

          <div className="col-span-12 flex items-end md:col-span-4 md:col-start-9">
            <dl className="grid w-full border-t border-[#171717]/10">
              {metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[6rem_minmax(0,1fr)] gap-6 border-b border-[#171717]/10 py-4"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
                    {label}
                  </dt>
                  <dd className="font-serif text-xl leading-tight tracking-[-0.035em]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="overflow-hidden border-y border-[#171717]/10 bg-white py-7"
      >
        <div className="home-marquee-track flex w-max animate-[marquee_48s_linear_infinite] gap-12 whitespace-nowrap font-serif text-4xl italic leading-none text-[#171717]/70 md:text-5xl">
          {[
            "Structured feedback",
            "Role matching",
            "Clear tradeoffs",
            "User control",
            "CV history",
            "Cover letters",
          ]
            .concat([
              "Structured feedback",
              "Role matching",
              "Clear tradeoffs",
              "User control",
              "CV history",
              "Cover letters",
            ])
            .map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-12">
                {item}
                <span className="not-italic text-[#171717]/25">*</span>
              </span>
            ))}
        </div>
      </section>

      <section id="workflow" className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
              Chapter 01
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="max-w-[10ch] font-serif text-[clamp(3.5rem,12vw,7rem)] leading-[0.9] tracking-[-0.055em]">
              Simple flow, useful output.
            </h2>
          </div>
          <div className="col-span-12 grid border-t border-[#171717]/10 md:grid-cols-3">
            {workflow.map((item) => (
              <article
                key={item.step}
                className="border-b border-[#171717]/10 py-8 md:border-r md:px-8 md:last:border-r-0"
              >
                <div className="mb-12 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
                  <span>{item.step}</span>
                  <span>{item.label}</span>
                </div>
                <h3 className="font-serif text-4xl leading-[0.95] tracking-[-0.04em]">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-[35ch] text-sm leading-6 text-[#5f5f58]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="principles"
        className="bg-[#171717] px-6 py-20 text-white md:px-12 md:py-28"
      >
        <div className="mx-auto grid max-w-screen-2xl grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
              Chapter 02 / Product stance
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <h2 className="font-serif text-[clamp(3.25rem,12vw,7rem)] leading-[0.9] tracking-[-0.055em]">
              Guidance first. Automation second.
            </h2>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/70">
              Nyx keeps the user in control. It explains weak points, surfaces
              missing job signals, and saves the evolution of each application
              decision without pretending to replace judgment.
            </p>
            <Link
              href="/register"
              className="mt-10 inline-flex border-b border-white pb-1 text-[11px] font-bold uppercase tracking-[0.22em]"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductFrame() {
  return (
    <div className="border border-[#171717]/10 bg-white p-3">
      <div className="grid min-h-[26rem] grid-cols-12 border border-[#171717]/10 bg-[#f7f7f4]">
        <div className="col-span-12 border-b border-[#171717]/10 p-5 md:col-span-4 md:border-b-0 md:border-r">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
            CV repository
          </p>
          <div className="mt-10 space-y-3">
            {["Senior Frontend CV.pdf", "Fullstack Product CV.pdf", "Case Study Notes.docx"].map(
              (item, index) => (
                <div key={item} className="border border-[#171717]/10 bg-white p-3">
                  <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f68]">
                    <span>0{index + 1}</span>
                    <span>{index === 0 ? "Active" : "Saved"}</span>
                  </div>
                  <p className="mt-4 truncate text-sm font-semibold">{item}</p>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="col-span-12 p-5 md:col-span-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
                Job fit report
              </p>
              <p className="mt-4 font-serif text-6xl leading-none tracking-[-0.055em]">
                82%
              </p>
            </div>
            <div className="hidden w-32 border-t border-[#171717]/20 pt-3 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f68] sm:block">
              Recruiter signal
            </div>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {["Matched", "Missing", "Improve"].map((label, index) => (
              <div key={label} className="border border-[#171717]/10 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                  {label}
                </p>
                <div className="mt-8 h-1.5 bg-[#171717]/10">
                  <div
                    className="h-full bg-[#171717]"
                    style={{ width: `${[78, 42, 64][index]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-[#171717]/10 pt-5">
            <p className="max-w-xl text-sm leading-6 text-[#5f5f58]">
              Add quantified achievements, expose Redis project context, and
              tighten the summary around backend ownership.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
