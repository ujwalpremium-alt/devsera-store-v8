import { 
  Palette, 
  Briefcase, 
  Film, 
  Music, 
  MessageSquare, 
  Youtube, 
  Cloud, 
  Gamepad2,
  BookOpen,
  Camera,
  Code,
  Layers
} from 'lucide-react';

interface CategoryIconsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'All': <Layers className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Design': <Palette className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Business': <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Streaming': <Film className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Music': <Music className="h-4 w-4 sm:h-5 sm:w-5" />,
  'AI': <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Video': <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Cloud': <Cloud className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Gaming': <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Education': <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Photography': <Camera className="h-4 w-4 sm:h-5 sm:w-5" />,
  'Development': <Code className="h-4 w-4 sm:h-5 sm:w-5" />,
};

export function CategoryIcons({ categories, selectedCategory, onSelectCategory }: CategoryIconsProps) {
  return (
    <div className="overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      <div className="flex gap-2 sm:gap-3 min-w-max">
        {categories.map(category => {
          const icon = categoryIcons[category] || <Layers className="h-4 w-4 sm:h-5 sm:w-5" />;
          const isSelected = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] md:min-w-[80px] ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${
                isSelected 
                  ? 'bg-white/20' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {icon}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
