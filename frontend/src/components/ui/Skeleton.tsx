import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const SKELETON_HEIGHTS = [120, 80, 150, 100, 130, 90, 110, 140];

// TODO: One component per file
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
}) => {
  const style = {
    width,
    height,
  };

  return <div className={`skeleton ${className}`} style={style} />;
};

export const ChartSkeleton: React.FC = () => (
  <div className="w-full h-80">
    <div className="chart-controls">
      <div className="flex space-x-2">
        <Skeleton width={80} height={36} />
        <Skeleton width={80} height={36} />
        <Skeleton width={100} height={36} />
      </div>
      <Skeleton width={80} height={36} />
    </div>
    <div className="h-64 bg-gray-100 rounded flex items-end justify-around p-4">
      {SKELETON_HEIGHTS.map((height, i) => (
        <Skeleton key={i} width={20} height={height} className="mx-1" />
      ))}
    </div>
  </div>
);

export const DailySummarySkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton width="60%" height={24} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={20} />
      </div>
      <div className="space-y-2">
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={20} />
      </div>
      <div className="space-y-2">
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={20} />
      </div>
    </div>
  </div>
);
