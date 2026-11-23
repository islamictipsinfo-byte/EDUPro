import { BookOpen, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ebook } from '../types';

interface EbooksPageProps {
  navigate: (path: string) => void;
}

export function EbooksPage({ navigate }: EbooksPageProps) {
  const { user, bootstrap, apiFetch } = useAuth();
  const [levelFilter, setLevelFilter] = useState<string>('All E-Books');
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Premium' | 'My E-Books'>(
    'All'
  );
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [readingBook, setReadingBook] = useState<Ebook | null>(null);

  useEffect(() => {
    if (!user) {
      setClaimedIds([]);
      return;
    }
    apiFetch<{ claimedEbookIds: string[] }>('/api/enrollments/my')
      .then((res) => setClaimedIds(res.claimedEbookIds))
      .catch(() => {});
  }, [user, apiFetch]);

  const ebooks = bootstrap?.ebooks ?? [];
  const levels = ['All E-Books', 'HSC 27', 'SSC 27', 'IELTS', 'Class 9'];

  const filtered = ebooks.filter((eb) => {
    if (levelFilter !== 'All E-Books' && eb.level !== levelFilter) return false;
    if (priceFilter === 'Free' && !eb.isFree) return false;
    if (priceFilter === 'Premium' && eb.isFree) return false;
    if (priceFilter === 'My E-Books' && !claimedIds.includes(eb.id)) return false;
    return true;
  });

  const handleAction = async (book: Ebook) => {
    if (claimedIds.includes(book.id)) {
      setReadingBook(book);
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await apiFetch<{ claimedEbookIds: string[] }>('/api/ebooks/claim', {
      method: 'POST',
      body: JSON.stringify({ ebookId: book.id }),
    });
    setClaimedIds(res.claimedEbookIds);
    setReadingBook(book);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/90 via-slate-50 to-white pb-16 pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            All E-Books
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Concise bilingual grammar short-notes, board suggestions, and IELTS speaking guides.
          </p>

          {/* Level Tabs */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  levelFilter === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Price / Owned Filter */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(['All', 'Free', 'Premium', 'My E-Books'] as const).map((pf) => (
              <button
                key={pf}
                type="button"
                onClick={() => setPriceFilter(pf)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  priceFilter === pf
                    ? 'bg-[#062436] text-white'
                    : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pf}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => {
            const owned = claimedIds.includes(book.id);
            const discountPct =
              !book.isFree && book.originalPrice > book.price
                ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
                : 0;
            return (
              <div
                key={book.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span
                      className={book.isFree ? 'text-emerald-700' : 'text-indigo-700'}
                    >
                      {book.isFree ? 'FREE' : `PREMIUM · -${discountPct}%`}
                    </span>
                    <span className="text-slate-500">
                      {book.level} · {book.pagesCount} pages
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-extrabold text-slate-900">{book.title}</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">By {book.author}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{book.summary}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    {book.isFree ? (
                      <span className="text-base font-extrabold text-emerald-700">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono-tabular text-lg font-extrabold text-indigo-700">
                          ৳{book.price}
                        </span>
                        <span className="font-mono-tabular text-xs text-slate-400 line-through">
                          ৳{book.originalPrice}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAction(book)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#062436] px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{owned ? 'Read Now' : book.isFree ? 'Get Free' : 'Unlock E-Book'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* E-Book Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-label={readingBook.title}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  {readingBook.level} Digital Reader
                </span>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  {readingBook.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReadingBook(null)}
                aria-label="Close e-book reader"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {readingBook.sampleContent.map((para, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800"
                >
                  {para}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
