---
title: "What 205 lb leaves out"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "data-modeling"]
summary: "Two barbells can weigh 205 lb and have different plates. HabitTracker stores the setup I can reuse."
---

A 45 lb bar with `45 + 25 + 10` on each side weighs 205 lb. So does the same bar with `35 + 35 + 10` on each side. If my history only says *205 lb*, I still have a decision to make at the rack.

A HabitTracker set stores the bar, the unit, and two ordered plate stacks. Here's the first setup, and what happens if I take the 25 off the right sleeve.

| Bar | Left | Right | Total |
| --- | --- | --- | --- |
| 45 lb | 45 + 25 + 10 | 45 + 25 + 10 | 205 lb |
| 45 lb | 45 + 25 + 10 | 45 + 10 | 180 lb |

The second row is one of the app's test cases. The independent right stack survives a save and reload, down to the order of the plates. The builder warns about the unequal sides. [The journal's round-trip cases](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/tests/HabitTracker.Mobile.Tests/JournalTests.cs#L8-L28)

The stacks are small ordered values, so the desktop API stores each in a JSON column on the set. History loads the original stacks and calculates the total from them. The `PlateLoad` type copies the input arrays, too. One test builds a 135 lb setup, changes a 45 in the source array to 100, and checks that the load is still 135 lb. [API persistence](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Services/WorkoutService.cs#L35-L53) · [The array-copy test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/PlateLoadTests.cs#L43-L50)

When I reuse a set from History, the editor can put back the plates I had on each side. The total comes along for free. [More HabitTracker articles](/tags/habittracker/)
