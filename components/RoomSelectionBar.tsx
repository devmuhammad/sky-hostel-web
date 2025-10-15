import React from "react";
import Link from "next/link";
import { BedDouble, Building2, Users } from "lucide-react";

interface RoomSelectionBarProps {
  className?: string;
}

const RoomSelectionBar: React.FC<RoomSelectionBarProps> = ({
  className = "",
}) => {
  return (
    <div className={`w-full bg-white rounded-2xl shadow-lg ${className}`}>
      <div className="w-full max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-stretch gap-3 justify-between">
        <div className="w-full ">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md h-full">
            <div className="bg-gray-100 p-2 rounded">
              <BedDouble size={18} className="text-gray-600" />
            </div>
            <div className="flex flex-col flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Room type
              </label>
              <div className="text-sm font-medium text-gray-900">
                Room of 4 & 6
              </div>
            </div>
          </div>
        </div>

        <div className="w-full ">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md h-full">
            <div className="bg-gray-100 p-2 rounded">
              <Building2 size={18} className="text-gray-600" />
            </div>
            <div className="flex flex-col flex-1">
              <label className="block text-xs text-gray-500 mb-1">Blocks</label>
              <div className="text-sm font-medium text-gray-900">Block A-E</div>
            </div>
          </div>
        </div>

        <div className="w-full ">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md h-full">
            <div className="bg-gray-100 p-2 rounded">
              <Users size={18} className="text-gray-600" />
            </div>
            <div className="flex flex-col flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Students
              </label>
              <div className="text-sm font-medium text-gray-900">
                2-6 students
              </div>
            </div>
          </div>
        </div>

        <div className="w-full  flex items-center">
          <Link href="/sold-out" className="w-full  h-full">
            <button className="w-full  bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition-colors h-full">
              Start Registration
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomSelectionBar;
