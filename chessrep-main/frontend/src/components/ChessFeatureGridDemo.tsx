import { FeatureGrid, type Feature } from "./ui/feature-grid";

// Chess-themed features for the platform
const chessFeatures: Feature[] = [
  {
    imageSrc: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Chess tactics and puzzles",
    title: "Tactical Puzzles",
    description: "Solve thousands of chess puzzles to improve your tactical vision. Practice forks, pins, skewers, and other tactical motifs with instant feedback.",
    href: "/puzzles",
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1601379327920-97001d532514?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Chess game analysis",
    title: "Game Analysis",
    description: "Analyze your games with powerful chess engines. Get detailed move evaluations, identify mistakes, and discover improvement opportunities.",
    href: "/analyze",
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Chess opening study",
    title: "Opening Training",
    description: "Master chess openings with interactive lessons and practice. Learn from grandmaster games and build your opening repertoire systematically.",
    href: "/openings",
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Chess endgame practice",
    title: "Endgame Practice",
    description: "Perfect your endgame technique with specialized training. Practice king and pawn endgames, rook endgames, and complex theoretical positions.",
    href: "/endgame",
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Live chess analysis",
    title: "Live Analysis",
    description: "Get real-time analysis during your games. See engine suggestions, evaluate positions, and improve your decision-making process.",
    href: "/live-analysis",
  },
  {
    imageSrc: "https://images.unsplash.com/photo-1594736797933-d0c29b4b5b5b?w=320&h=320&fit=crop&crop=center",
    imageAlt: "Chess study and learning",
    title: "Study Tools",
    description: "Create and share chess studies with annotations and variations. Collaborate with other players and build your chess knowledge base.",
    href: "/enhanced-chess-study",
  },
];

// The demo component that showcases the FeatureGrid
const ChessFeatureGridDemo = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Master Chess with Our Complete Training Suite
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-300">
          Whether you're a beginner learning the basics or an advanced player refining your technique, our comprehensive chess platform has everything you need to improve your game.
        </p>
      </div>
      
      <FeatureGrid features={chessFeatures} />
    </div>
  );
};

export default ChessFeatureGridDemo;
