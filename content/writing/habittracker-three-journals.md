---
title: "One workout screen, three journals"
date: 2026-11-17
draft: false
tags: ["habittracker", "csharp", "architecture"]
summary: "The same mobile Log set button can save to a device journal, a sandbox of sample sessions, or the existing API."
---

I want to be able to hand someone a demo of FORM and let them log whatever they like. On my own device, I'd also like to be able to try that demo and come back to the workout I had open.

The OpenSilver workout screen sends its commands to `MobileWorkspace`. The workspace calls `IWorkoutJournal` when I log a set. The factory decides which journal that means when I choose a mode. [The journal factory](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/src/HabitTracker.Mobile.Core/JournalFactory.cs#L19-L38)

- **Local** saves on the device. The browser host uses IndexedDB for that origin. The MAUI host uses JSON files in the app's data directory.
- **Demo** uses the same local journal code with its own storage keys and a starter set of synthetic workouts.
- **Connected** talks to the existing ASP.NET Core API. Its workouts live in the API's SQLite database.

Each mode also gets a workspace for the draft, active session, and timer. The mode-switch test logs a 205 lb set in Local, opens Demo, and returns to Local. The set and its 90-second timer are there when the workspace switches back. A second test gives Connected an unavailable server and checks that the Local workout stays open. [The mode-switch tests](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/tests/HabitTracker.Mobile.Tests/WorkspaceTests.cs#L65-L99)

I can show the distinction in two browser tabs. The plain preview opens the journal selected by the device preferences. Adding `?demo=1` to a preview URL opens the sample journal for that launch. The same workout screen is doing the work in both tabs. [Browser preview instructions](https://github.com/jayhuangsci/HabitTracker/blob/830430893ef11669c300314773056d4f11203b30/docs/mobile.md#run-the-browser-preview)

[More HabitTracker articles](/tags/habittracker/)
