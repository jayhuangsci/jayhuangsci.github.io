---
title: "When a set saves and the reply gets lost"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "testing"]
summary: "The mobile journal keeps a set's ID so it can resolve a save whose outcome was unclear."
---

I tap **Log set**. The journal records it, but the app gets an error before it can show the saved row. Was the set saved? From the screen alone I can't tell, and a second tap could add the same five reps twice.

The mobile workspace gives the set a client-generated ID and saves the whole pending request before asking the journal to write it. If the write comes back uncertain, the draft stays locked and the button becomes **Retry pending save**. The next attempt carries the same plates, reps, and ID. [The save command](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/MobileWorkspace.Training.cs#L149-L180)

If the journal reports a conflict on retry, the workspace reloads the saved sets and looks for that ID. Finding it confirms the original save. Startup and refresh use the same check, so reopening can settle the question before I tap anything. In Connected mode, SQLite enforces the uniqueness of the client-set ID. [Reload and reconciliation](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/MobileWorkspace.cs#L185-L224) · [The API's unique index](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Data/HabitTrackerDbContext.cs#L29-L38)

The test makes the local store commit a 205 lb set and then throw an exception. It checks that the first workspace has a pending save. A fresh workspace opens the same store, clears that pending state, and finds exactly one set. The assertion I want here is `Assert.Single`. The test would fail if that first set disappeared or if the app added a second one. [The commit-then-throw test and store](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/tests/HabitTracker.Mobile.Tests/WorkspaceTests.cs#L121-L167)

[More HabitTracker articles](/tags/habittracker/)
