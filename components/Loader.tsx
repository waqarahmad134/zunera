export default function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-16">
          {/* spinning accent ring */}
          <span className="absolute inset-0 rounded-2xl border-2 border-line border-t-accent animate-spin [animation-duration:0.9s]" />
          {/* Z monogram */}
          <span className="absolute inset-1.5 grid place-items-center rounded-xl bg-accent text-paper font-serif italic text-2xl leading-none animate-pulse">
            Z
          </span>
        </div>
        <p className="text-sm tracking-wide text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
