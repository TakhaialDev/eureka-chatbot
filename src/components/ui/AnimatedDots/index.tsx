import { motion } from "framer-motion";

interface BouncingDotsProps {
  size?: number;
  gap?: number;
  color?: string;
}

export default function AnimatedDots({
  size = 4,
  gap = 6,
  color = "#fff",
}: BouncingDotsProps) {
  const dotStyle = {
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: "50%",
  };

  return (
    <div style={{ display: "flex", gap }} className="items-center mx-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={dotStyle}
          animate={{ y: ["0%", "-60%", "0%"] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
