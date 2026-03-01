"use client";

type CategoryTabsProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function CategoryTabs({ categories, activeCategory, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeCategory === category
              ? "bg-violet-600 text-white"
              : "bg-violet-50 text-violet-700 hover:bg-violet-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
