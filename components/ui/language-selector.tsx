"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/translation"
import { useToast } from "@/hooks/use-toast";

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const { toast } = useToast();

  const handleLanguageChange = (value: LanguageCode) => {
    onLanguageChange(value);
    const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === value);
    toast({
      title: `Language changed to ${selectedLang?.name}`,
      duration: 2000,
    });
  };

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[80px] md:w-[180px] px-2 md:px-3">
        <SelectValue placeholder="Lang">
          {currentLanguage}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[100px]">
        <SelectGroup>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}