import { TestimonialsColumn } from "./ui/testimonials-columns-1";
import { motion } from "framer-motion";

const chessTestimonials = [
  {
    text: "ChessRep transformed my tactical vision completely. The puzzle training helped me improve from 1200 to 1800 rating in just 6 months!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Alex Chen",
    role: "Chess Player",
  },
  {
    text: "The game analysis feature is incredible. I can finally see exactly where I'm making mistakes and how to improve my endgame technique.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Sarah Johnson",
    role: "Club Player",
  },
  {
    text: "As a chess coach, I love using ChessRep to analyze my students' games. The detailed move evaluations help me provide better guidance.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Michael Rodriguez",
    role: "Chess Coach",
  },
  {
    text: "The opening training module is fantastic. I've built a solid repertoire and my early game performance has improved dramatically.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    name: "Emma Thompson",
    role: "Tournament Player",
  },
  {
    text: "ChessRep's live analysis during games is a game-changer. I can see engine suggestions in real-time and make better decisions.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "David Kim",
    role: "Online Player",
  },
  {
    text: "The endgame practice section helped me master king and pawn endgames. My conversion rate in winning positions has skyrocketed!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Lisa Wang",
    role: "Rated Player",
  },
  {
    text: "I love how ChessRep identifies my weaknesses and creates personalized training. It's like having a personal chess trainer available 24/7.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "James Wilson",
    role: "Chess Enthusiast",
  },
  {
    text: "The study tools are amazing for creating annotated games. I can share positions with my chess friends and collaborate on analysis.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    name: "Maria Garcia",
    role: "Study Group Leader",
  },
  {
    text: "ChessRep's 40-game analysis report gave me incredible insights into my playing patterns. I finally understand what's holding me back!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Robert Taylor",
    role: "Improving Player",
  },
];

const firstColumn = chessTestimonials.slice(0, 3);
const secondColumn = chessTestimonials.slice(3, 6);
const thirdColumn = chessTestimonials.slice(6, 9);

const ChessTestimonials = () => {
  return (
    <section className="bg-gray-800 py-16 relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="border border-purple-500 py-1 px-4 rounded-lg text-purple-400 text-sm font-medium">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            What Our Chess Players Say
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            See what our chess community has to say about ChessRep.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default ChessTestimonials;
