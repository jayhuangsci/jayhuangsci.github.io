---
title: "What 205 lb leaves out"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "data-modeling"]
summary: "The displayed total is a calculation. The bar and ordered sleeve arrays form the record that survives a round trip."
---

A 45 lb bar with `45 + 25 + 10` on each sleeve weighs 205 lb. So does a 45 lb bar with `35 + 35 + 10` on each sleeve. If I save the total, I lose the distinction. Even the sum on each side loses the order in which I stacked the plates. A sleeve with `45 + 25 + 10` and one with `10 + 25 + 45` contribute the same mass. I have to remember which setup I used if all I recorded was the sum.

That is the reason to keep the arrays. In HabitTracker, `PlateLoad` takes the bar weight, a single unit, and an ordered list for each side. It can calculate both sleeve totals and the display number from there. `IsBalanced` asks whether the sleeve totals are equal. It says precisely that, even when the composition or order differs. [The plate value and its derived properties](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/PlateLoad.cs#L10-L35)

## The value needs to survive an edit

There's a small test with a 45 lb bar and one 45 lb plate per side. It passes the same mutable array to the constructor for both sleeves, then changes the source element to 100. Here's the whole test body. [The source-array test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/PlateLoadTests.cs#L43-L50)

```csharp
decimal[] plates = [45];
var load = new PlateLoad(45, plates, plates, WeightUnit.Pounds);
plates[0] = 100;
Assert.Equal(135, load.TotalWeight);
```

With two read-only wrappers around the caller's array, I'd still have a mutable load. The wrappers protect access through the new references. The old reference could change both sleeves, taking the result from 135 to 245. `PlateLoad` copies each input before exposing it as read-only. The same rule matters when the builder mirrors a stack. The value captured for this set should survive later edits in the builder. [Copying and parsing the stacks](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/PlateLoad.cs#L24-L43) · [The bounded array copy](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/PlateLoad.cs#L76-L82)

The parser is another boundary. It accepts `45lbs+25lbs+10` in pounds and allows an empty sleeve. A suffix has to agree with the selected unit. It parses decimal points with an invariant culture, which gives a pasted plate expression one interpretation across clients. A 20 kg bar with `20 + 5 + 1.25` on both sleeves produces 72.5 kg. That is a decimal value in the original unit all the way through the calculation. [The parser and display conversion](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/PlateLoad.cs#L45-L74) · [The fractional plate and invalid input cases](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Core.Tests/PlateLoadTests.cs#L25-L41)

## Save enough to recalculate

The HTTP request carries the bar, stacks, and unit without a total. The API validates those inputs and stores each stack as JSON on the set row. When it responds, it reads the arrays back into a `PlateLoad` and calculates the total. In the integration test, a 205 lb request comes back with both ordered arrays after an HTTP reload. The endpoint derives 1,025 lb of training volume for five reps from that same set. [The request contract](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingContracts.cs#L48-L70) · [The save and reload test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Api.Tests/WorkoutApiTests.cs#L41-L55)

Storing each sleeve as one column has a tradeoff. The current history query looks up sessions and exercises, and a sleeve has at most sixteen entries. Reading or writing the array is a small part of the set operation. A query such as “show every set with a 1.25 kg plate on the inside sleeve” would need to interpret JSON, or give plate membership its own representation and index. There is no such query in the training workflow. The history operation that matters is rebuilding the setup I selected. [The set mapping](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Data/HabitTrackerDbContext.cs#L30-L38) · [Constructing the historical load](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Services/WorkoutService.cs#L86-L98)

[More HabitTracker articles](/tags/habittracker/)
