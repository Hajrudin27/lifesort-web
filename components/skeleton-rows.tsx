export function SkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
    return (
      <>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: columns }).map((_, j) => (
              <td key={j} className="px-5 py-4">
                <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
              </td>
            ))}
          </tr>
        ))}
      </>
    );  
  }