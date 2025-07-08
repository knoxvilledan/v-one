type Props = {
  score: number;
};

export default function ScoreBar({ score }: Props) {
  return (
    <div className="w-full bg-gray-300 rounded-full h-4 mb-4 overflow-hidden">
      <div
        className="bg-green-500 h-full text-xs text-white text-center transition-all duration-300"
        style={{ width: `${score}%` }}
      >
        {score}%
      </div>
    </div>
  );
}
