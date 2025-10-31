"use client";
import { calculateSimpleCompletionBlock } from "../lib/simple-time-blocks";

interface IconTrackingData {
  water: number; // remaining count
  cigarettes: number; // remaining count
  trees: number; // remaining count
}

interface IconTrackingBarProps {
  iconData: IconTrackingData;
  onInjectToTimeBlock: (
    icon: string,
    message: string,
    targetBlock?: number
  ) => void;
  onUpdateIconData: (data: IconTrackingData) => void;
}

const INITIAL_COUNTS = {
  water: 10,
  cigarettes: 15,
  trees: 10,
};

const ICON_CONFIG = {
  water: {
    icon: "💧",
    label: "Water",
    color: "blue",
    message: "Water consumed",
  },
  cigarettes: {
    icon: "🚬",
    label: "Cigarettes",
    color: "red",
    message: "Cigarette smoked",
  },
  trees: {
    icon: "🌳",
    label: "Trees",
    color: "green",
    message: "Tree planted/helped",
  },
};

export default function IconTrackingBar({
  iconData,
  onInjectToTimeBlock,
  onUpdateIconData,
}: IconTrackingBarProps) {
  // Handle icon click
  const handleIconClick = (iconType: keyof typeof INITIAL_COUNTS) => {
    if (iconData[iconType] <= 0) return; // No more icons available

    const config = ICON_CONFIG[iconType];
    const now = new Date();
    const currentTimeBlock = calculateSimpleCompletionBlock(now);
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create the message to inject into timeblock
    const message = `${config.icon} ${config.message} (${timestamp})`;

    // Inject into timeblock
    onInjectToTimeBlock(config.icon, message, currentTimeBlock);

    // Update count (decrease by 1) - this will save to database via parent
    onUpdateIconData({
      ...iconData,
      [iconType]: iconData[iconType] - 1,
    });
  };

  // Reset function (for testing or manual reset)
  const resetCounts = () => {
    onUpdateIconData({
      water: INITIAL_COUNTS.water,
      cigarettes: INITIAL_COUNTS.cigarettes,
      trees: INITIAL_COUNTS.trees,
    });
  };

  return (
    <div className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/20 shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            📊 Daily Icon Tracker
          </h3>
          <button
            onClick={resetCounts}
            className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reset all counts to default"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Icon Grid - Responsive Layout */}
      <div className="p-4">
        {/* Desktop/Tablet: 3 columns in 1 row */}
        <div className="hidden sm:grid grid-cols-3 gap-6">
          {/* Water Column */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
              💧 Water ({iconData.water} left)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: INITIAL_COUNTS.water }, (_, index) => (
                <button
                  key={`water-${index}`}
                  onClick={() => handleIconClick("water")}
                  disabled={index >= iconData.water}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.water
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-blue-100 dark:bg-blue-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.water
                      ? "Click to consume water"
                      : "Already consumed"
                  }
                >
                  💧
                </button>
              ))}
            </div>
          </div>

          {/* Cigarettes Column */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">
              🚬 Cigarettes ({iconData.cigarettes} left)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: INITIAL_COUNTS.cigarettes }, (_, index) => (
                <button
                  key={`cigarette-${index}`}
                  onClick={() => handleIconClick("cigarettes")}
                  disabled={index >= iconData.cigarettes}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.cigarettes
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-red-100 dark:bg-red-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.cigarettes
                      ? "Click to smoke cigarette"
                      : "Already smoked"
                  }
                >
                  🚬
                </button>
              ))}
            </div>
          </div>

          {/* Trees Column */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">
              🌳 Trees ({iconData.trees} left)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: INITIAL_COUNTS.trees }, (_, index) => (
                <button
                  key={`tree-${index}`}
                  onClick={() => handleIconClick("trees")}
                  disabled={index >= iconData.trees}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.trees
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-green-100 dark:bg-green-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.trees
                      ? "Click to plant/help tree"
                      : "Already planted/helped"
                  }
                >
                  🌳
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: 3 rows in 1 column */}
        <div className="sm:hidden space-y-6">
          {/* Water Row */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
              💧 Water ({iconData.water} left)
            </h4>
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {Array.from({ length: INITIAL_COUNTS.water }, (_, index) => (
                <button
                  key={`water-mobile-${index}`}
                  onClick={() => handleIconClick("water")}
                  disabled={index >= iconData.water}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.water
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-blue-100 dark:bg-blue-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.water
                      ? "Click to consume water"
                      : "Already consumed"
                  }
                >
                  💧
                </button>
              ))}
            </div>
          </div>

          {/* Cigarettes Row */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">
              🚬 Cigarettes ({iconData.cigarettes} left)
            </h4>
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {Array.from({ length: INITIAL_COUNTS.cigarettes }, (_, index) => (
                <button
                  key={`cigarette-mobile-${index}`}
                  onClick={() => handleIconClick("cigarettes")}
                  disabled={index >= iconData.cigarettes}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.cigarettes
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-red-100 dark:bg-red-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.cigarettes
                      ? "Click to smoke cigarette"
                      : "Already smoked"
                  }
                >
                  🚬
                </button>
              ))}
            </div>
          </div>

          {/* Trees Row */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">
              🌳 Trees ({iconData.trees} left)
            </h4>
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {Array.from({ length: INITIAL_COUNTS.trees }, (_, index) => (
                <button
                  key={`tree-mobile-${index}`}
                  onClick={() => handleIconClick("trees")}
                  disabled={index >= iconData.trees}
                  className={`
                    w-8 h-8 text-lg rounded transition-all duration-200
                    ${
                      index < iconData.trees
                        ? "hover:scale-110 hover:shadow-md cursor-pointer bg-green-100 dark:bg-green-900/30"
                        : "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                  title={
                    index < iconData.trees
                      ? "Click to plant/help tree"
                      : "Already planted/helped"
                  }
                >
                  🌳
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
