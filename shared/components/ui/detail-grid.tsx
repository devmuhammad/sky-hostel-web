import { ReactNode } from "react";

interface DetailSection {
  title: string;
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}

interface DetailGridProps {
  sections: DetailSection[];
  columns?: 1 | 2 | 3;
}

export function DetailGrid({ sections, columns = 2 }: DetailGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {sections.map((section, index) => (
        <div
          key={index}
          className={section.items.length > 4 ? "md:col-span-2" : ""}
        >
          <h4 className="font-medium text-gray-900 mb-3">{section.title}</h4>
          <div className="space-y-2 text-sm">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex flex-col sm:flex-row">
                <span className="text-gray-500 sm:w-1/3 flex-shrink-0">
                  {item.label}:
                </span>
                <span className="text-gray-900 sm:w-2/3 break-words">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
