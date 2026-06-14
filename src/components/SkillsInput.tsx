import { memo, useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}

const standardSuggestions = [
  "نجارة",
  "صيانة منزلية",
  "تركيب أثاث",
  "تنظيف شقق",
  "مساعد مطبخ",
  "نادلة",
  "تنظيم فعاليات",
  "تسويق ميداني",
  "تصوير فوتوغرافي",
  "توصيل طلبات",
  "دهانات",
  "سباكة",
  "كهرباء شقق",
];

export default memo(function SkillsInput({
  value = [],
  onChange,
  placeholder = "أضف مهارة جديدة...",
}: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeSkill = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  return (
    <div className="space-y-3 text-right">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => addSkill(inputValue)}
          variant="secondary"
          size="icon"
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestion Chips */}
      {inputValue.trim() && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold">مقترحات:</p>
          <div className="flex flex-wrap gap-1">
            {standardSuggestions
              .filter(
                (s) =>
                  s.includes(inputValue) &&
                  !value.includes(s)
              )
              .slice(0, 5)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors px-2 py-0.5 rounded-full border"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Selected Skills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {value.map((skill, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-2.5 py-1 text-xs gap-1 flex items-center bg-primary/5 hover:bg-primary/10 border border-primary/20 text-foreground font-semibold"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="text-primary hover:text-red-600 rounded-full hover:bg-primary/20 p-0.5 transition-colors focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground italic">لم يتم تحديد أي مهارات بعد.</p>
        )}
      </div>
    </div>
  );
});
