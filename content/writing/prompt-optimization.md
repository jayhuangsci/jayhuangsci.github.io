---
title: "What a rejected reroll taught me about prompts"
date: 2026-11-12
draft: false
summary: "A seeded test stayed green after I introduced a random-state bug. Watching the next wave exposed what the review prompt needed to ask for."
tags: [prompt-engineering, case-study, evaluation]
---

Star Defense v0.8 gives the player a hand of satellite rewards before a wave. One rule sounds straightforward. A rejected reroll should spend neither the position's allowance nor a draw from the random number generator. A stale click may leave everything on screen alone and still break the second part of that rule. The damage can turn up in a later hand.

I wanted a prompt that could ask for a useful review of this behavior. “Improve Star Defense's satellite reward system” was where the example started. That leaves the reviewer free to redesign the reward pool, the economy, or the UI. I narrowed it to the existing v0.8 draft and its documented transitions. That was enough to get to a more interesting question. What would count as evidence that a rejected command leaves the random state alone?

## A seed gives you a control

The v0.8 headless suite has a sensible starting point in `DraftChecks.cs`. It opens two games with seed 711 and gives both the same first hand. One receives rejected commands before the two games perform the same legal reroll. The check compares the resulting kinds and reroll flags in each position. I reran the suite at revision `d4730b9`. It passed 34 groups and 3,743 assertions.

The opening hand for that seed is Burn, Overclock, Split. There are four types in the catalog, and a replacement must exclude all three visible types. The only legal replacement for that hand is Bleed. So both games can show Bleed after the valid reroll even if they reached different random states. A choice from a list of length one always returns index zero. The call still advances the xorshift generator in `ProgressionSystem.Next`.

## Follow the two games into wave two

I made a scratch copy and changed only the unknown-offer branch in `TryReroll`. It still rejected the command. Before returning, it consumed one draw. This was a deliberately broken version to try against the check.

```csharp
if (offer == null)
{
    Next(2);
    return false;
}
```

All 34 existing groups still passed against that version. The group for seeded drafts passed too. I then tried a separate probe. Start two games at seed 711, send one an unknown offer ID, reroll the first card in both, choose the first card in both, and advance to wave two. These are the observed card kinds in display order.

| Observation | Control | After a rejected call |
| --- | --- | --- |
| Opening hand | Burn, Overclock, Split | Burn, Overclock, Split |
| After the legal reroll | Bleed, Overclock, Split | Bleed, Overclock, Split |
| Wave two | Overclock, Bleed, Split | Bleed, Overclock, Burn |

On the unmodified revision both games produced the control sequence all the way through. The first two rows of the broken version look fine and the earlier comparison stops there. Wave two shuffles a pool with more than one possible choice. Carrying the same probe that far makes the forgotten draw visible. It also gives me a way to check the rule without reaching into a private field to compare generator state.

## Ask for the transition that could disprove the claim

That changed the prompt I wanted. The important addition is an observable consequence, and a request to separate reading the code from running the check.

```text
Review the v0.8 draft rules in Docs/Prototype-v0.8.md.
Trace a rejected reroll through ProgressionSystem.TryReroll.
Use two games at seed 711. Send one an unknown offer ID.
In both games, reroll position zero, select position zero,
and open the next wave. Compare the next hands in order.

For a finding, give the rule, the code path, and the first
observable difference. Say which checks you actually ran.
Treat proposed checks as proposals.
```

The comparison also tells me how to judge an answer. If it reports success after inspecting the immediate hand, the evidence stops too early. If it follows both games into wave two, I can check its reproduction against a fixed fixture. This is a result about the game and the strength of one check. Measuring which wording leads a model to produce better reviews would be a separate experiment.
