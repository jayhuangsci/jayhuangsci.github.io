---
title: "When a set saves and the reply gets lost"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "testing"]
summary: "A saved set and its acknowledgement can come apart. Reusing the original client ID lets the app tell what happened."
---

A useful failure to test in a workout journal is one where the set is already on disk when the caller sees an error. From the keyboard, that looks like a failed save. From the database, it looks like a finished write. If my next click constructs a new set, it can record the same five reps again. The weight, exercise, and date are poor ways to detect that. Two legitimate sets in the same workout often have identical values.

## Keep the identity before sending the request

On the first tap, the mobile workspace builds a `LogSetRequest`. The request carries a generated client ID and a snapshot of the reps, unit, and plate stacks. The workspace persists it as pending before it calls the journal. The next tap after an uncertain save reuses the original request. While it is pending, the UI locks the draft. Editing the reps under the same ID would make it ambiguous which set the ID referred to. [The request type](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Core/TrainingContracts.cs#L48-L70) · [The mobile save command](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/MobileWorkspace.Training.cs#L149-L180)

The persistence rule has to reach the API. Connected mode posts to the existing SQLite-backed journal, where `ClientId` has a unique index. The service checks for the ID and the database also enforces uniqueness, which covers overlapping attempts that both pass the preliminary query. The workout row has a separate revision token for concurrent session changes. These are different failure cases. A conflict can mean a replay of this set, or it can mean that the journal changed while the request was in flight. [The set insert](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Services/WorkoutService.cs#L38-L52) · [The index and revision token](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Data/HabitTrackerDbContext.cs#L20-L38) · [HTTP conflict mapping](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/src/HabitTracker.Api/Services/ApiExceptionHandler.cs#L11-L23)

## A conflict is a reason to read again

On a conflict, the mobile workspace reloads the journal and looks for the pending client ID. If it finds it, there's a saved set to show. If the set is absent, the original conflict still propagates. Startup and manual refresh also look for the ID before clearing pending state. In the API integration test, two posts of the same request produce a success and a 409. A fresh read returns a single set. [The API replay test](https://github.com/jayhuangsci/HabitTracker/blob/d3463cfb2ff3bc9d0940fb0ae5f936ae51c37d56/tests/HabitTracker.Api.Tests/WorkoutApiTests.cs#L58-L69) · [Startup and refresh reconciliation](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/MobileWorkspace.cs#L185-L224)

| Situation | What the next read can establish |
| --- | --- |
| The original write failed before saving the set | The ID is absent. A retry can submit the same request. |
| The original write committed before an error reached the app | The ID is present. The app can show the saved set. |
| A different edit caused a conflict | The conflict itself gives no evidence the pending ID was saved. |

## Make the failure happen on the right side of the write

The mobile test wraps the local store. It lets a real journal write succeed in the underlying test store and only then throws an `IOException`. The first workspace reports an error and keeps its pending ID. A fresh workspace opens the same store, finds the ID, and shows one 205 lb set. That test is stronger than an adapter that simply throws on every call. The latter only exercises the first row of the table. [The interrupted-write test and store](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/tests/HabitTracker.Mobile.Tests/WorkspaceTests.cs#L121-L139) · [The commit-then-throw adapter](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/tests/HabitTracker.Mobile.Tests/WorkspaceTests.cs#L156-L167)

The identity in this example belongs to a set. A new workout session is created in a separate call before the app submits its first set. That gives the test a precise boundary. Even if the caller loses the outcome of the set write, it can still ask whether *that* set exists. [Session creation and the pending set](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/MobileWorkspace.Training.cs#L149-L170)

[More HabitTracker articles](/tags/habittracker/)
