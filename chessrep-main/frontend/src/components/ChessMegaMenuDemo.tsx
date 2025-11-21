// ChessMegaMenuDemo.tsx
import * as React from "react";
import MegaMenu from "./ui/mega-menu";
import type { MegaMenuItem } from "./ui/mega-menu";
import {
  Target,
  BookOpen,
  Trophy,
  Brain,
  Clock,
  Zap,
  Eye,
  Shield,
  Crown,
  RefreshCw,
  Play,
  Settings,
  HelpCircle,
  Mail,
  DollarSign,
  Info,
  ChevronRight
} from "lucide-react";

const ChessMegaMenuDemo = () => {
  const NAV_ITEMS: MegaMenuItem[] = [
    {
      id: 1,
      label: "Training",
      subMenus: [
        {
          title: "Core Modules",
          items: [
            {
              label: "Tactical Training",
              description: "Master chess tactics and combinations",
              icon: Target,
            },
            {
              label: "Endgame Mastery",
              description: "Learn essential endgame techniques",
              icon: Trophy,
            },
            {
              label: "Opening Theory",
              description: "Build your opening repertoire",
              icon: BookOpen,
            },
            {
              label: "Blunder Prevention",
              description: "Identify and avoid common mistakes",
              icon: Shield,
            },
          ],
        },
        {
          title: "Advanced Training",
          items: [
            {
              label: "Bot Training",
              description: "Practice against AI opponents",
              icon: Brain,
            },
            {
              label: "Advantage Conversion",
              description: "Learn to convert winning positions",
              icon: Zap,
            },
            {
              label: "Visualization",
              description: "Improve board visualization skills",
              icon: Eye,
            },
            {
              label: "Time Management",
              description: "Master time control strategies",
              icon: Clock,
            },
          ],
        },
        {
          title: "Analysis Tools",
          items: [
            {
              label: "40-Game Report",
              description: "Comprehensive performance analysis",
              icon: RefreshCw,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      label: "Resources",
      subMenus: [
        {
          title: "Learning",
          items: [
            {
              label: "Chess Lessons",
              description: "Structured learning paths",
              icon: BookOpen,
            },
            {
              label: "Guess the Move",
              description: "Study master games",
              icon: Eye,
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Leaderboard",
              description: "Compete with other players",
              icon: Trophy,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      label: "Platform",
      subMenus: [
        {
          title: "Features",
          items: [
            {
              label: "Live Analysis",
              description: "Real-time game analysis",
              icon: Eye,
            },
            {
              label: "Board Editor",
              description: "Create custom positions",
              icon: Settings,
            },
            {
              label: "PGN Import/Export",
              description: "Manage your game files",
              icon: RefreshCw,
            },
            {
              label: "Mobile Support",
              description: "Train on any device",
              icon: Play,
            },
          ],
        },
        {
          title: "Support",
          items: [
            {
              label: "Help Center",
              description: "Get help and tutorials",
              icon: HelpCircle,
            },
            {
              label: "Contact Us",
              description: "Reach out to our team",
              icon: Mail,
            },
            {
              label: "About ChessStrive",
              description: "Learn about our mission",
              icon: Info,
            },
          ],
        },
      ],
    },
    { id: 4, label: "Pricing", link: "/pricing" },
    { id: 5, label: "About", link: "/about" },
    { id: 6, label: "Contact", link: "/contact" },
  ];

  return (
    <div className="relative flex h-[450px] w-full items-start justify-center bg-black p-10">
      <MegaMenu items={NAV_ITEMS} />
    </div>
  );
};

export { ChessMegaMenuDemo };
