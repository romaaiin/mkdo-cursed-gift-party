<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Game rules live in pure functions in src/game/engine.ts (immutable state in, new state out) so solo AI and future online mode share one rules engine; covered by src/game/engine.test.ts.
- Card illustrations are resolved by a presentation-only mapping with CDN asset pointers; do not embed screenshot rules in cards or couple artwork to the rules engine.
- The lobby and game use a shared landscape stage rotated inside portrait viewports; keep dialogs inside that stage and fan transforms in CSS so hit targets rotate with the visuals.
- Device-only audiovisual preferences live in a shared provider with browser storage; keep audio gesture-initialized and outside the rules engine so settings never affect gameplay or require an account.
- The landscape rules guide distinguishes official card powers from provisional solo behavior so documentation never silently legitimizes unimplemented rules.
- First-game guidance derives its steps from real game state and completed actions; keep completion device-local and never alter deals or rules to force tutorial events.
- PlayerHand owns bounded horizontal scrolling and overflow controls; large hands use a flatter fan so every card stays accessible outside the end-turn control.
