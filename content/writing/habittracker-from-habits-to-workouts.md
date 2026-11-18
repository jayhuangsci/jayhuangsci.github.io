---
title: "How HabitTracker became a workout journal"
date: 2026-11-17
draft: false
featured: true
tags: ["habittracker", "csharp", "sqlite"]
summary: "Adding strength training meant giving sets their own history and proving the old habits survived the upgrade."
---

The April plan for HabitTracker starts with a 5 km run. The app needed to remember the date and the distance. A habit named Running might have a row for Monday and another for Tuesday. In the database there's a unique index on the pair `(HabitId, Date)`. That gives the app one quantity to update when I change Monday's entry. [The original plan](https://github.com/jayhuangsci/HabitTracker/blob/18e1ce043e817ed7ff3a21f6069cfa427895bcf8/docs/prd.md) · [The habit log index](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Data/HabitTrackerDbContext.cs#L71-L87)

Now suppose I squat three sets in the same session. The first is a warmup. The next two are at the same weight and one has fewer reps. Grouping by exercise and date would put all three under the same key. The repeated value is meaningful here. If I pick a row from history next week, I want to know which set I picked and how to put those plates back.

## Give the new behavior its own schema

The strength migration creates `WorkoutSessions` and `WorkoutSets`. The session owns the date and completion time. The set owns its exercise, repetitions, and the original plate configuration. A workout date has a regular index for finding sessions. A set has its own ID and a separate unique client ID so a retry can be recognized without treating two intentional sets as duplicates. [The strength migration](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Migrations/20261115234745_AddStrengthTraining.cs#L12-L83)

That choice let the WPF client keep the existing HTTP boundary. The client could add a workout editor and history view while the API continued to serve the habit screens against the old tables. At startup, the API applies migrations before serving requests. The new version can start against a database already in use and add the schema that it needs. The new tables also have their own lifetime. Deleting a session cascades to its sets. [API startup](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Program.cs#L35-L45) · [Workout relationships](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Data/HabitTrackerDbContext.cs#L19-L39)

## Bring an old database to the test

A green test against a fresh database would have told me that both migrations work from scratch. The test I wanted for this change had to start further along. `UpgradePreservesExistingHabitData` opens a temporary SQLite file, explicitly stops at the April migration, and saves a running habit there. It then starts the new API against that same file. The test asks the server to do three things.

1. List habits and return `Original running habit`.
2. Create a workout.
3. Return seven statistics points from the old habit endpoint with `range=week`.

The first request makes the upgrade observable from a client's point of view. The second forces the new schema to do real work. The third follows the old record through an additional API path. The fixture inserts a habit definition and checks the statistics endpoint's shape. An upgrade check for existing daily quantities would need to insert a daily log and assert on the value too. [The migration test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Api.Tests/WorkoutApiTests.cs#L115-L135)

## Where the change ends

One deployment choice follows from the migration itself. The `Down` method drops the workout tables. Reversing the schema after logging new workouts would discard those rows. The test gives me confidence in upgrading the SQLite file while preserving the existing habit behavior. A data-preserving rollback would need a separate plan. [The migration's reverse operation](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Migrations/20261115234745_AddStrengthTraining.cs#L85-L92)

The desktop walkthrough adds a second test of whether the change is finished. Log a set, restart the client, find the unfinished workout, complete it, and pull the setup back into the editor. Opening history after a restart exercises the same boundary that motivated the schema change. Daily Habits can still answer what I recorded on Monday. The workout can answer which set I selected and how to load the bar for it. [The desktop workflow test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Desktop.Tests/DesktopFlowTests.cs) · [The Windows demo](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/docs/demo.md)

[More HabitTracker articles](/tags/habittracker/)
