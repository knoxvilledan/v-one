// Server Component for daily score display

interface ScoreDisplayProps {
  score: number;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="text-lg font-medium">
        Daily Score:{" "}
        <span className="text-blue-600 dark:text-blue-400">{score}</span>
      </div>
    </div>
  );
}
