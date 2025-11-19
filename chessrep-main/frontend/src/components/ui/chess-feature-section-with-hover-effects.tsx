import { cn } from "../../lib/utils";
import Icons8Icons from "../Icons8Icons";

export function ChessFeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Tactical Puzzles",
      description:
        "Solve thousands of chess puzzles to improve your tactical vision. Practice forks, pins, skewers, and other tactical motifs.",
      icon: <Icons8Icons.Target className="h-8 w-8" />,
    },
    {
      title: "Game Analysis",
      description:
        "Analyze your games with powerful chess engines. Get detailed move evaluations and discover improvement opportunities.",
      icon: <Icons8Icons.Brain className="h-8 w-8" />,
    },
    {
      title: "Opening Training",
      description:
        "Master chess openings with interactive lessons. Learn from grandmaster games and build your opening repertoire.",
      icon: <Icons8Icons.BookOpen className="h-8 w-8" />,
    },
    {
      title: "Endgame Practice",
      description:
        "Perfect your endgame technique with specialized training. Practice king and pawn endgames and complex positions.",
      icon: <Icons8Icons.Trophy className="h-8 w-8" />,
    },
    {
      title: "Live Analysis",
      description:
        "Get real-time analysis during your games. See engine suggestions and improve your decision-making process.",
      icon: <Icons8Icons.Eye className="h-8 w-8" />,
    },
    {
      title: "Study Tools",
      description:
        "Create and share chess studies with annotations and variations. Collaborate with other players and build knowledge.",
      icon: <Icons8Icons.Crown className="h-8 w-8" />,
    },
    {
      title: "Time Management",
      description:
        "Master time management in chess. Learn to use your clock effectively and make better decisions under pressure.",
      icon: <Icons8Icons.Clock className="h-8 w-8" />,
    },
    {
      title: "Visualization Training",
      description:
        "Improve your board visualization skills. Practice blindfold chess and enhance your mental chess abilities.",
      icon: <Icons8Icons.RefreshCw className="h-8 w-8" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-6 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <ChessFeature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const ChessFeature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-6 relative group/feature border-gray-700",
        (index === 0 || index === 4) && "lg:border-l border-gray-700",
        index < 4 && "lg:border-b border-gray-700"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-purple-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gray-600 group-hover/feature:bg-purple-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-gray-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
