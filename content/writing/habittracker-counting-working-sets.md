---
title: "Which sets count toward progress?"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "testing"]
summary: "One weekly-volume fixture separates what the journal records from what the chart measures."
---

On Sunday I finish a workout with five reps at 205 lb and a warmup on the empty bar. In History I want to see both sets. When I look at the weekly chart I want to see the work I meant to track, which in this journal is 205 × 5. The difference belongs in the definition of the chart. Both sets remain useful entries.

The weekly-volume test makes those choices visible in one fixture. It labels today November 15, 2026 and asks for three calendar weeks. It adds an unfinished workout one week earlier and a completed row dated the following day. The synthetic future entry gives the date filter something to reject. Condensed to the rows relevant to the calculation, the fixture looks like this. [The original fixture](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/AnalyticsTests.cs#L7-L26)

| Workout date | State | Sets available to the chart | Volume contributed |
| --- | --- | --- | --- |
| Nov 8 | In progress | One working set at 205 lb | 0 lb |
| Nov 15 | Completed | Five working reps at 205 lb and a 45 lb warmup | 1,025 lb |
| Nov 16 | Completed | One working set at 205 lb | 0 lb |

## Which date did the work belong to?

`WeeklyVolume` uses the workout's `DateOnly` date to place the workout and its completion time only to decide eligibility. If I log a Sunday session and finish entering it on Monday, its work still belongs to Sunday. It shows up in the week starting Monday, November 9. The upper bound is the injected date of today, so the following day's row stays out. This also gives the function a testable calendar without asking it to infer today from the timestamp of a row. [Weekly grouping and date bounds](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingAnalytics.cs#L24-L37) · [The workout response](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingContracts.cs#L85-L94)

The function builds the full sequence of Mondays before returning the points. For an empty week the collection of qualifying rows is empty, yielding a zero. Returning only the weeks present in a group-by would leave the graph to infer spacing. The test makes the shape part of the contract with three points and a zero. Session count has its own rule, too. It counts the qualifying completed sessions, so a finished warmup-only session can count as a session while contributing zero working volume.

## Normalize at the boundary of the calculation

The personal-record test pits 205 lb against 100 kg and includes a 500 lb warmup. The comparison converts the working sets to pounds before sorting. The 100 kg set comes out around 220.46 lb and wins. The same function returns an estimate for one-rep max using eligible sets. That estimate can come from a different set than the heaviest recorded load because reps enter the formula. For example, a single at 100 kg is about 220.46 lb. Five reps at 205 lb produce an Epley estimate of about 239.17 lb. In that case I'd want to see 220.46 as the best recorded load and 239.17 as the estimate, even though they came from different sets. [The mixed-unit and estimate tests](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/AnalyticsTests.cs#L28-L41) · [How records are calculated](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingAnalytics.cs#L18-L49)

The CSV export has a different job. It iterates through the original sets with columns for status, kind, and unit. Opening the file after looking at a chart gives me an answer for why the 45 lb appears in one place and the other one shows 1,025. I can trace each number back to a decision about state, date, or units without losing the evidence that decision was made from. [The columns and export loop](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingAnalytics.cs#L52-L67)

[More HabitTracker articles](/tags/habittracker/)
