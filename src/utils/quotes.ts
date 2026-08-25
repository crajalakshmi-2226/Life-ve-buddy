import { DailyQuote } from '../types';

export const FALLBACK_QUOTES: { quote: string; author: string }[] = [
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { quote: "Focus on progress, not perfection.", author: "Bill Phillips" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Study hard, what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "Continuous effort—not strength or intelligence—is the key to unlocking our potential.", author: "Winston Churchill" }
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchDailyQuote(forceRefresh = false): Promise<DailyQuote> {
  const cachedQuoteRaw = localStorage.getItem("dailyQuoteData");

  if (!forceRefresh && cachedQuoteRaw) {
    try {
      const cached = JSON.parse(cachedQuoteRaw) as DailyQuote;
      if (cached.timestamp && Date.now() - cached.timestamp < ONE_DAY_MS) {
        return cached;
      }
    } catch (e) {
      console.warn("Error parsing cached quote", e);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch("https://dummyjson.com/quotes", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("API response not ok");
    const data = await response.json();
    const quotesList = (data && Array.isArray(data.quotes)) ? data.quotes : [];
    if (quotesList.length === 0) throw new Error("No quotes returned");

    const picked = quotesList[Math.floor(Math.random() * quotesList.length)];
    const newQuote: DailyQuote = {
      quote: picked.quote,
      author: picked.author || 'Inspirational Thinker',
      timestamp: Date.now()
    };

    localStorage.setItem("dailyQuoteData", JSON.stringify(newQuote));
    return newQuote;
  } catch (err) {
    const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    const fallbackQuote: DailyQuote = {
      quote: randomFallback.quote,
      author: randomFallback.author,
      timestamp: Date.now()
    };
    localStorage.setItem("dailyQuoteData", JSON.stringify(fallbackQuote));
    return fallbackQuote;
  }
}
