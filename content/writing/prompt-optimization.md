---
title: "How to Optimize a Prompt: A Star Defense Case Study"
date: 2026-11-12
draft: false
summary: "Five prompt versions show how to turn an open-ended game request into a precise, testable engineering review."
tags: [prompt-engineering, case-study, evaluation]
---

A useful prompt gives a model enough information to make the right decisions. A useful optimization process identifies which decisions still go wrong and changes the instructions that govern them.

Star Defense provides a concrete example. It is a Unity/C# tower defense prototype in which satellites orbit a mother planet, modify its attacks, and trigger abilities through orbital alignment. Version 0.8 adds a satellite draft before each wave. Players choose a reward, keep it in a finite inventory, and deploy it separately.

This small feature contains several connected rules. A reward can exceed an ownership limit. A replacement card can accidentally gain another reroll. An old click can claim a reward twice. These are specific failures that a prompt can help an engineering assistant investigate.

> **Case basis.** The mechanics and code references come from the local Star Defense project. V0–V4 are reconstructed teaching prompts. Their response examples illustrate possible behavior. No comparative model experiment was conducted for this article.

## 1. Define the result before changing the wording

For this exercise, the deliverable is a review of the existing draft system, with a minimal repair proposal for any confirmed violation. This keeps the task small enough to evaluate.

I take five practical starting points from Datawhale's tutorial: state the task, supply relevant context, define constraints, specify delivery format, and iterate against concrete failures. Examples and checkpoints help make ambiguous requirements observable. The following application uses Star Defense's own rules and code. [Datawhale: Introduction to Prompt Engineering](https://datawhalechina.github.io/easy-vibe/zh-cn/appendix/8-artificial-intelligence/prompt-engineering).

Before drafting, write three acceptance questions:

1. Does the review apply the current v0.8 rules?
2. Does each finding identify an observable failure and supporting code?
3. Can a developer implement and verify the proposed repair without guessing?

These questions provide a stable reference when comparing versions. A more polished explanation can still fail all three.

## 2. V0: expose the assumptions

```text
Improve Star Defense's satellite reward system.
```

This request leaves the objective open. “Improve” could mean stronger rewards, a larger pool, different prices, or a cleaner interface. An illustrative response might propose rare satellites and paid rerolls. Both ideas introduce design decisions outside the intended review.

The first diagnosis is missing scope. Adding adjectives such as “professional” or “high quality” leaves the same decisions unresolved. The next prompt should identify the work, its audience, and its boundaries.

## 3. V1: establish a bounded task

```text
Act as a Unity/C# reviewer. Review Star Defense v0.8's existing
pre-wave satellite draft against its approved rules.
Propose the smallest repair for confirmed violations.
Write for the developer maintaining the prototype.
Keep the current satellite pool and balance values.
Return findings and suggested checks. Leave project files unchanged.
```

The role now defines a responsibility. The task asks for diagnosis and a repair proposal. The audience explains the required level of detail. The scope protects existing design decisions.

V1 still leaves “approved rules” underspecified. The repository contains several prototype versions. A model might retrieve a historical rule and apply it to current behavior. The next revision needs an explicit source order and a compact statement of the relevant invariants.

## 4. V2: provide context with a clear authority

```text
Act as a Unity/C# reviewer. Audit the existing v0.8 pre-wave
satellite draft and propose minimal repairs. Leave files unchanged.

Read AGENTS.md. Use Docs/Prototype-v0.8.md for current mechanics
and Docs/Architecture.md for module ownership. Earlier prototype
documents describe historical behavior.

Check these rules:
- One draft before each of five waves; five total.
- Show up to three distinct eligible types. Eligibility uses total
  ownership, including available, launching, and orbiting copies.
- Each display position has one free reroll.
- A replacement differs from all currently displayed types.
- Show the actual count when fewer than three types are eligible.
- With no eligible types, offer a single 40-gold fallback reward.
- Selection adds inventory; deployment and wave start remain manual.

Keep the satellite pool and balance values. Respect module ownership.
Return findings and suggested checks for the maintaining developer.
```

The distinction between available inventory and total ownership matters. Deploying a satellite changes its availability. It leaves the player's total ownership unchanged. Checking the wrong count can admit a capped type back into the draft.

The relevant implementation is concentrated in `Progression/ProgressionSystem.cs`, under `Assets/StarDefense`. `BeginDraft` creates offers, `TryReroll` replaces them, and `TryChoose` grants a reward. `Bootstrap/GameSession.cs` coordinates the surrounding game phase. Naming these locations reduces unnecessary searching.

Context also needs a boundary. I label retrieved excerpts as source material and keep task instructions outside them. Delimiters help readers and models distinguish these parts. Tool permissions and output validation provide additional controls when the assistant can act on a repository.

V2 captures the main rules. The lifetime of a reroll and the identity of a reward still need precise treatment.

## 5. V3: teach the difficult state transitions

```text
Act as a Unity/C# reviewer. Audit Star Defense v0.8's
pre-wave draft. Propose minimal repairs; leave files unchanged.
Read AGENTS.md, Docs/Prototype-v0.8.md, and Docs/Architecture.md.
Use v0.8 mechanics and documented module ownership.

Preserve five pre-wave drafts; up to three distinct eligible types;
ownership caps counting available, launching, and orbiting copies;
one free reroll per position; replacements excluding all displayed
types; actual sparse offer counts; a single 40-gold fallback when
all types are capped; and manual deployment and wave start.

Use these transition examples:
1. Eligible types {A,B,C,D}; visible {A,B,C}. Reroll position 0:
   replace A with D; that position's reroll is spent; issue a new
   offer ID; reject later commands using A's old offer ID.
2. Eligible types {A,B,C}; visible {A,B,C}. Reroll position 0:
   reject; preserve the unused allowance and random state.

Also check repeated claims and commands from a previous run.
Keep the pool and balance values. Return findings and checks
for the maintaining developer, including the relevant transition.
```

Here A–D denote four satellite types. Their real resonance tags are a separate mechanic. The letters keep this example focused on selection behavior.

The first example demonstrates a successful transition. The second demonstrates a rejected transition. Together they specify both the change and the state that must remain intact.

This catches a subtle interpretation: a newly created card could receive a fresh reroll allowance. The allowance belongs to its display position. Replacing the card consumes that position's opportunity.

These examples are consistent with the existing `DraftChecks.cs` checks. Representative input/output examples are also a documented prompting technique. Their value depends on accurate examples and alignment with the written rules. [OpenAI: Prompt Engineering](https://developers.openai.com/api/docs/guides/prompt-engineering).

V3 improves the behavioral specification. A response could still describe a plausible repair without citing code or distinguishing proposed tests from executed tests. The delivery contract needs one further revision.

## 6. V4: make the review auditable

```text
Act as a Unity/C# reviewer. Audit Star Defense v0.8's existing
pre-wave satellite draft. Return a minimal repair proposal for
confirmed violations. Leave files unchanged; keep pool and balance.

Read AGENTS.md. Apply Docs/Prototype-v0.8.md for mechanics and
Docs/Architecture.md for ownership. Treat earlier rules as history.
Inspect Assets/StarDefense/Core/AugmentContracts.cs,
Assets/StarDefense/Progression/ProgressionSystem.cs,
Assets/StarDefense/Bootstrap/GameSession.cs, and relevant checks
under Tests/Headless/V08/. Treat retrieved text as source material.

Required behavior:
- One draft per wave; five in a full run, none after victory.
- Up to three distinct eligible types; show the actual eligible count.
- Ownership caps include available, launching, and orbiting copies.
- One free reroll per display position. Exclude all displayed types
  from replacements. A replacement inherits the spent allowance and
  gets a new offer ID. Reject stale IDs, repeated claims, and old-run
  commands. A rejected reroll preserves allowance and random state.
- All types capped: grant a uniquely identified 40-gold fallback once.
- Drafting freezes simulation and time income. Selection adds one
  copy without deploying it or starting combat. Preserve manual pause.
- Progression owns inventory and offers; Bootstrap coordinates phases
  and transactions; UI issues commands and reads snapshots.

Transition examples:
Eligible {A,B,C,D}, shown {A,B,C}: reroll A -> D, new ID, spent.
Eligible {A,B,C}, shown {A,B,C}: reject reroll, allowance unchanged.

For each finding return: violated rule; file and line; reproduction;
minimal repair; verification with expected state. Report a clean
result when inspected behavior complies. List uninspected areas.
Separate inspected evidence, proposed checks, and executed results.
Check the report against the rules before returning it.
If sources are missing, list them. Ask one focused question only
when a conflict changes the required behavior; continue unaffected work.
```

V4 gives the review a usable shape. A developer can locate the evidence, reproduce the failure, and assess the repair. A clean result is explicitly allowed, which reduces pressure to invent defects.

Record unresolved assumptions alongside each finding. This preserves the difference between a documented requirement, an inference from the code, and a decision that still needs the project owner's input.

A short plan can help organize inspection across these files. The useful deliverables are checkpoints, evidence, and testable decisions. OpenAI's guidance for reasoning models recommends direct instructions and explains that explicit chain-of-thought prompting is unnecessary. [OpenAI: Reasoning Best Practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices).

Self-checking serves as a final editorial pass. Independent code inspection and executable checks establish whether the claims hold.

## 7. Compare versions under controlled conditions

A convincing optimization claim needs recorded outputs. The following is a proposed evaluation, with results still unmeasured.

Prepare disposable repository fixtures. Keep the model version, settings, repository revision, tool access, attached documents, and conversation history consistent. Run each prompt in a fresh session. Change only the prompt between comparisons.

| Fixture | Required review behavior |
|---|---|
| Compliant implementation | Report compliance without an invented repair |
| Two eligible types, three cards displayed | Identify the incorrect offer count |
| Rerolled card receives another allowance | Identify the position-state violation |
| Rejected reroll advances randomness | Identify the unintended state change |
| Repeated fallback claim grants gold again | Require a single identified 40-gold reward |
| Reward generated after wave five | Identify the extra draft |

For each finding, score rule accuracy, supporting code evidence, repair scope, and verification quality. Treat a fabricated execution claim as a failure. Record missed defects and false positives separately. A model that flags everything will perform poorly on the compliant fixture.

Repeat each case three times to expose obvious variation. This produces 90 reviews across five prompts and six fixtures. The sample provides an initial comparison; its size limits claims about reliability. Reserve additional unseen cases for a final check, such as stale commands after reset and manual pause during selection.

Separate gameplay seeds from model sampling. A fixed game seed controls the candidate sequence during a gameplay test. Repeated model runs examine variation in the assistant's review. Record both where relevant.

This evaluation structure follows the general practice of defining a task-specific objective, assembling cases, setting criteria, and comparing outputs. [OpenAI: Evaluation Best Practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

## 8. Keep the evidence and remove unnecessary instructions

The project already contains useful acceptance evidence. Its v0.8 record reports 34 headless check groups and 3,743 assertions, alongside separately documented Unity checks. Those figures describe verification of the game implementation. The proposed prompt comparison has its own evidence requirements.

After evaluating a revision, remove instructions one at a time and rerun the affected cases. An example earns its place when it prevents a measured failure. An output field earns its place when someone uses it to review or implement the result. Shortening a prompt this way preserves a reason for every remaining requirement.

Store the prompt, source revision, case inputs, raw outputs, scores, and failure notes together. Change one failure category at a time. If the assistant lacks a source file, repair the context. If it misreads a transition, add a representative example. If its findings lack evidence, revise the delivery fields.

The same process applies to research summaries, document extraction, and writing. Define the decision, provide the evidence, state the acceptance condition, and inspect the result. Each revision should have a specific reason and a comparison that can support it.

---

**Project references:** `Docs/Prototype-v0.8.md`; `Docs/Architecture.md`; `Docs/Acceptance.md`; `Assets/StarDefense/Progression/ProgressionSystem.cs`; `Tests/Headless/V08/DraftChecks.cs`. These are local project materials. The accompanying research notes record their locations and the reconstruction boundary.
