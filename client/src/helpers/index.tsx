import { useState, useEffect } from "react";

const TypingEffect = ({ text = "", speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);

        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return (
    <span className="typing-effect">
      {displayedText}
      <span className="cursor">|</span>
    </span>
  );
};

export default TypingEffect;
