---
title: "How HabitTracker became a workout journal"
date: 2026-11-17
draft: false
featured: true
tags: ["habittracker", "csharp", "sqlite"]
summary: "A 5 km run fit the original habit tracker. A barbell set needed its own record."
---

The example in my April plan for HabitTracker was a 5 km run. I'd enter the distance against a date and look it up later. By May there was a WPF client, an API, and a database with habits and daily logs. The example was still a good fit for those two tables. [The original project plan](https://github.com/jayhuangsci/HabitTracker/blob/18e1ce043e817ed7ff3a21f6069cfa427895bcf8/docs/prd.md)

At the gym, I think in plates. I want to jot down what I put on each sleeve while it's still in front of me. A workout can have several sets of the same exercise, and I can change the load between sets. A date and a quantity leave too much of that out. [Why I built FORM](https://github.com/jayhuangsci/HabitTracker/blob/8ab2542d11c066dc9ca050544bfa5d5146377c19/README.md#why-i-built-it)

I kept the habits and added sessions and sets. WPF still sends requests over HTTP. The API validates each set and writes it to SQLite, with the bar, unit, and both plate stacks saved together. The same plate calculation runs in the workout editor so I can check the total before I save. [The strength-training migration](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Migrations/20261115234745_AddStrengthTraining.cs)

An upgrade test gives the old app a say in whether the new one works. It creates a database using the April migration and inserts a running habit. Then it starts the new API and checks that the habit is still listed and its statistics endpoint responds. A test against an empty database would have missed that part of the upgrade. [The migration test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Api.Tests/WorkoutApiTests.cs#L115-L133)

The desktop demo ends with a small round trip. Log a set, close the app, reopen the unfinished workout, and finish it. Then pick the set in History and reuse its plates. The last step is what makes the journal useful to me. It tells me how to load the bar next time. [The Windows walkthrough](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/docs/demo.md)

[More HabitTracker articles](/tags/habittracker/)
