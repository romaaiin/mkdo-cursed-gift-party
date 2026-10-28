import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TUTORIAL_LESSONS, type TutorialStep } from "@/game/tutorial";

export function TutorialGuide({ step, onStart, onStop }: { step: TutorialStep; onStart: () => void; onStop: () => void }) {
  const lesson = TUTORIAL_LESSONS[step];
  const content = <>
    <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-display text-sm text-primary"><GraduationCap className="h-4 w-4 shrink-0" />{lesson.title}</h2><Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label="Arrêter le tutoriel" title="Arrêter le tutoriel" onClick={onStop}><X /></Button></div>
    <p className="tutorial-copy">{lesson.text}</p>
    {step === "welcome" && <div className="flex gap-2 pt-3"><Button autoFocus onClick={onStart}>Commencer</Button><Button variant="outline" onClick={onStop}>Passer le tutoriel</Button></div>}
    {(step === "return" || step === "winner") && <Button className="mt-2 h-8" onClick={onStop}>Terminer le tutoriel</Button>}
  </>;
  if (step === "welcome") return <div className="action-overlay tutorial-welcome"><div className="action-dialog tutorial-intro" role="dialog" aria-modal="true" aria-label="Ta première partie">{content}</div></div>;
  return <aside className="tutorial-panel" aria-label="Conseil du tutoriel" aria-live="polite">{content}</aside>;
}