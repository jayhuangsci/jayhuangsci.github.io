---
title: "Which sets count toward progress?"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "testing"]
summary: "A test for weekly volume spells out what to do with warmups, open workouts, and dates in the future."
---

A warmup belongs in my workout history. It adds zero to the weekly volume chart. That rule is easy to state and easy to lose when the chart gets handed a list of saved sets.

One test fixes today's date at Sunday, November 15, 2026. It gives the chart three sessions. [The weekly-volume test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/AnalyticsTests.cs#L7-L26)

| Session | What goes into weekly volume |
| --- | --- |
| A finished session today with five reps at 205 lb and a 45 lb warmup | 1,025 lb |
| An unfinished session a week ago with five reps at 205 lb | 0 lb |
| A completed record dated tomorrow | 0 lb |

The test asks for three weeks. The 1,025 lb lands in the one that starts on Monday, November 9. Empty weeks get their own zero points, so a quiet week occupies the same space on the chart as any other. [The weekly grouping code](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingAnalytics.cs#L24-L37)

The original unit matters, too. In the personal-records test, a 100 kg working set beats a 205 lb working set once they're both expressed in pounds. The saved sets keep the units I entered. CSV exports every set with its status, kind, and original plates. I can open it and see the warmup that the chart skipped. [The mixed-unit test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/AnalyticsTests.cs#L28-L34) · [The CSV exporter](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingAnalytics.cs#L52-L67)

[More HabitTracker articles](/tags/habittracker/)
