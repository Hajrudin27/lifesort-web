export default function Loading() {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-rose-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
  
        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-stone-200" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-stone-100" />
  
          <div className="mt-10 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-stone-100"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }