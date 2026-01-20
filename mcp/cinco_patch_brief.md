# Cinco Patch Brief (must implement)

## Interaction
1) Card play must be 2-click max:
- First click on a hand card selects it (highlight + lifts slightly).
- Second click on the same selected card plays it (if legal).
- Clicking a different card switches selection (still 1 click).
- Clicking outside the hand cancels selection (optional but nice).
- No flow should require 3 clicks to play a legal card.

## Deck balance
2) Swap card count:
- There must be exactly 4 "Swap Hands" cards in the full deck total.

## Wild / +4 UX
3) Wild/+4 color picker must be cancelable:
- If the color picker opens and user decides not to play the card, they can close it (X button or outside click or Escape).
- Closing cancels the pending play and returns card to selected state (or unselected, but consistent).
- Must not force the user to commit the wild once opened.

## Power interactions and rules
4) Shield protection:
- If the player has an active Shield, it protects them from Swap Hands too (swap does not apply to them).
- Shield is consumed when it blocks an effect (define consistent behavior).

## UI and clarity
5) Draw pile emphasis:
- Draw pile should be slightly larger than discard pile (about 10-20% larger), but still responsive.

6) Explain card effects:
- Add a non-intrusive hint area that updates when a card is selected:
  - Example: small text under the center piles or above the player hand.
  - Must explain what the selected card does (Skip, Reverse, Draw Two, Draw Four, Swap Hands, Shield, etc).
- Must not block gameplay and must work on mobile.

## Acceptance checks
- All changes must work at 390x844, 430x932, 480x1040, 820x1180, 1280x800.
- No console errors.
- If needed, add data-testid:
  - cinco-hint
  - cinco-color-picker
  - cinco-color-picker-close
