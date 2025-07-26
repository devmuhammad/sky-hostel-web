import React from "react";

interface FeatureCardProps {
  title: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon }) => {
  return (
    <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-center gap-2 max-w-[220px] min-h-[60px]">
      <div className="w-6 h-6 flex items-center justify-center">
        {icon === "/icons/security-icon.svg" && (
          <div className="w-5 h-5 bg-white rounded-full"></div>
        )}
        {icon === "/icons/wifi-icon.svg" && (
          <div className="w-5 h-5 bg-white rounded"></div>
        )}
        {icon === "/icons/location-icon.svg" && (
          <div className="w-5 h-5 bg-white rounded-full"></div>
        )}
        {icon === "/icons/support-icon.svg" && (
          <div className="w-5 h-5 bg-white rounded"></div>
        )}
      </div>
      <h3 className="text-sm text-left">{title}</h3>
    </div>
  );
};

export default FeatureCard;
