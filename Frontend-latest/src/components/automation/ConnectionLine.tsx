import { motion } from "framer-motion";

interface ConnectionLineProps {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onDelete?: () => void;
  isActive?: boolean;
}

export function ConnectionLine({ id, x1, y1, x2, y2, onDelete, isActive = false }: ConnectionLineProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Create a curved path for better visual flow
  const controlX1 = x1 + (x2 - x1) * 0.5;
  const controlY1 = y1;
  const controlX2 = x1 + (x2 - x1) * 0.5;
  const controlY2 = y2;
  
  const pathD = `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;

  return (
    <g>
      <motion.path
        d={pathD}
        stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none"
      />
      
      {/* Animated flow indicator */}
      <motion.circle
        r="4"
        fill="hsl(var(--primary))"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{ offsetPath: `path('${pathD}')` }}
      />
      
      {/* Interactive delete button in the middle */}
      {onDelete && (
        <g 
          transform={`translate(${midX}, ${midY})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="cursor-pointer hover:opacity-100 opacity-60 transition-opacity"
        >
          <circle
            r="12"
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          <line
            x1="-4"
            y1="-4"
            x2="4"
            y2="4"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
          />
          <line
            x1="4"
            y1="-4"
            x2="-4"
            y2="4"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
          />
        </g>
      )}
    </g>
  );
}
