import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "./ui/button";

function Hero({ 
  title = "This is something",
  titles = ["amazing", "new", "wonderful", "beautiful", "smart"],
  description = "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
  onStartClick,
  onContactClick,
  showLaunchArticle = false,
  launchArticleText = "Read our launch article",
  startButtonText = "Start"
}) {
  const [titleNumber, setTitleNumber] = useState(0);

  const titlesArray = useMemo(() => titles, [titles]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titlesArray.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titlesArray]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          {showLaunchArticle && (
            <div>
              <Button variant="secondary" size="sm" className="gap-4">
                {launchArticleText} <MoveRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-cyan-50">{title}</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titlesArray.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              {description}
            </p>
          </div>
          <div className="flex flex-row gap-3">
            {onContactClick && (
              <Button size="lg" className="gap-4" variant="outline" onClick={onContactClick}>
                Jump on a call <PhoneCall className="w-4 h-4" />
              </Button>
            )}
            {onStartClick && (
              <Button size="lg" className="gap-4" onClick={onStartClick}>
                {startButtonText} <MoveRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };

