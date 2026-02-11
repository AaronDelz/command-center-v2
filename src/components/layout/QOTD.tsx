'use client';

import { useState, useEffect } from 'react';

interface Quote {
  text: string;
  author: string;
}

// Curated quotes — one per day, cycles through
const QUOTES: Quote[] = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Iron sharpens iron, and one man sharpens another.", author: "Proverbs 27:17" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", author: "Mark Zuckerberg" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.", author: "Charles Darwin" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Fortune favors the bold.", author: "Virgil" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "What we do in life echoes in eternity.", author: "Marcus Aurelius" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Do not go where the path may lead. Go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
];

function getDailyQuote(): Quote {
  // Use day of year as index so it changes daily
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

export function QOTD(): React.ReactElement {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  if (!quote || isCollapsed) {
    return (
      <div className="flex justify-center px-4 pt-3 md:pt-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-xs text-text-muted/40 hover:text-text-muted transition-colors"
          title="Show quote of the day"
        >
          ✨ QOTD
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 pt-3 md:pt-4">
      <div 
        className="inline-flex items-center gap-3 bg-accent/8 backdrop-blur-sm border border-accent/20 rounded-full px-5 py-2.5 max-w-3xl cursor-pointer hover:border-accent/30 transition-all group"
        onClick={() => setIsCollapsed(true)}
        title="Click to minimize"
      >
        <span className="text-accent/60 text-sm flex-shrink-0">✨</span>
        <p className="text-foreground/80 text-sm italic text-center">
          &ldquo;{quote.text}&rdquo;
          <span className="text-text-muted/60 text-xs not-italic ml-2">— {quote.author}</span>
        </p>
      </div>
    </div>
  );
}
