"use client";

import Lottie from "lottie-react";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { trpc } from "@/api/client";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { replaceAnimationPlaceholder } from "@/lib/animation-utils";

interface TextDockProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  textInput: string;
  setTextInput: (text: string) => void;
  selectedTextAnimation: string | null;
  setSelectedTextAnimation: (key: string | null) => void;
  onApplyText: () => void;
  onReset: () => void;
  hasAppliedText?: boolean;
}

const TemplateItem = ({
  template,
  debouncedText,
  isSelected,
  onSelect,
}: {
  template: {
    id: string;
    key: string;
    name: string;
    content?: unknown;
    limit?: number | null;
  };
  debouncedText: string;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const animationData = useMemo(() => {
    if (!template.content) return null;
    return replaceAnimationPlaceholder(
      template.content,
      debouncedText || "Sample",
    );
  }, [template.content, debouncedText]);

  if (!template.content || !animationData) return null;

  return (
    <button
      type="button"
      className={twMerge(
        "relative w-full overflow-hidden rounded-xl border-2 transition-all duration-200 aspect-video",
        isSelected
          ? "border-violet-500 bg-zinc-900 ring-2 ring-violet-500/20"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800",
      )}
      onClick={onSelect}
    >
      <div className="flex size-full items-center justify-center p-4">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          className="h-full w-full object-contain"
        />
      </div>
    </button>
  );
};

export default function TextDock({
  isOpen,
  setIsOpen,
  textInput,
  setTextInput,
  selectedTextAnimation,
  setSelectedTextAnimation,
  onApplyText,
  onReset,
  hasAppliedText = false,
}: TextDockProps) {
  const debouncedTextInput = useDebounce(textInput, 300);
  const [originalTextInput, setOriginalTextInput] = useState(textInput);
  const [originalAnimation, setOriginalAnimation] = useState(
    selectedTextAnimation,
  );
  const [wasOpen, setWasOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !wasOpen) {
      setOriginalTextInput(textInput);
      setOriginalAnimation(selectedTextAnimation);
    }
    setWasOpen(isOpen);
  }, [isOpen, textInput, selectedTextAnimation, wasOpen]);

  const {
    data: templates,
    isLoading,
    error,
  } = trpc.textTemplates.getAll.useQuery(undefined, { enabled: isOpen });
  const hasChanges =
    textInput !== originalTextInput ||
    selectedTextAnimation !== originalAnimation;
  const characterLimit =
    templates?.find((t) => t.key === selectedTextAnimation)?.limit ?? null;
  const exceedsLimit = !!characterLimit && textInput.length > characterLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput && selectedTextAnimation && hasChanges && !exceedsLimit) {
      onApplyText();
      setIsOpen(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Content
        </h3>
        <div className="relative">
          <textarea
            placeholder="Add your text here"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[100px] resize-none"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            autoFocus
          />
          {characterLimit && (
            <div className="absolute bottom-2 right-2">
              <span
                className={twMerge(
                  "text-xs font-medium",
                  exceedsLimit ? "text-rose-500" : "text-zinc-500",
                )}
              >
                {textInput.length} / {characterLimit}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              !textInput ||
              !selectedTextAnimation ||
              !hasChanges ||
              exceedsLimit
            }
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {hasAppliedText ? "Update Text" : "Add Text"}
          </Button>
          {hasAppliedText && (
            <Button
              variant="secondary"
              type="button"
              onClick={onReset}
              className="px-3"
            >
              <RotateCcw size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Style
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-violet-500" />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center p-4 text-rose-500 text-sm text-center">
              <p>Failed to load animations.</p>
            </div>
          )}
          {templates && (
            <div className="grid grid-cols-1 gap-4 pb-4">
              {templates.map((template) => (
                <TemplateItem
                  key={template.key}
                  template={template}
                  debouncedText={debouncedTextInput}
                  isSelected={selectedTextAnimation === template.key}
                  onSelect={() => setSelectedTextAnimation(template.key)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
