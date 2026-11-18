---
title: "Building a game asset agent that can refuse to finish"
date: 2026-11-13
draft: false
summary: "A review package should come from the latest inspected files. Two deliberately awkward cases test that boundary."
tags: [ai-agents, game-development, asset-pipeline]
---

I gave the agent a small job for Star Defense. Produce a cyan Overclock icon and a short confirmation cue. The brief calls for a transparent 256 × 256 image and a 0.32-second mono PCM16 WAV at 48 kHz with a peak at or below −3 dBFS. I wanted to get a folder I could review, with enough evidence to tell which files had actually passed those checks.

The first icon in the offline demo has precisely the requested dimensions and an opaque background. Its inspector reports zero transparent pixels. An agent could still say that the icon is done. The host gets to decide whether that file can be packaged.

## Inspect the bytes that were produced

Each generation writes a new filename and registers a candidate ID, a path under the job directory, and a SHA-256 digest. Inspection takes the ID and opens that candidate. The image check decodes the PNG and looks at its dimensions, channel format, and alpha. For this sparse icon it requires four transparent corners and more than half the pixels to be transparent. The sound check reads the WAV header and measures the peak from the PCM samples.

I reran the scripted demo and got this trail from `trace.jsonl`. The durations passed on both sound attempts. It was the measured peak that sent the first sound back to the renderer.

| Candidate | Evidence from the file | Decision |
| --- | --- | --- |
| `icon-1` | 256 × 256, transparent pixels 0 | Fail the background check |
| `icon-2` | 256 × 256, transparent pixels 56,977 | Pass |
| `sfx-1` | 0.32 s at 48 kHz, peak 0 dBFS | Fail the peak check |
| `sfx-2` | 0.32 s at 48 kHz, peak −6 dBFS | Pass |

The scripted coordinator placed four generation calls, four inspections, and one packaging call. That gives me evidence about the repair loop and the tools. These adapters draw and synthesize files locally. To learn how a model planner handles the same failures, I would have to run that adapter and review its traces separately. [Function calling flow](https://developers.openai.com/api/docs/guides/function-calling)

## Can an older good file get through?

A package operation that looks for *any* passing icon can silently ship an earlier revision. The tool in `asset-agent.mjs` follows the current candidate ID for each kind and requires its inspection to pass. Its second check hashes the files again just before packaging. I exercised both decisions with the local host.

First I generated and inspected a passing icon and a passing sound. Then I generated a second icon with an opaque background and inspected it. The older icon still had a passing record and the sound was still good. `package_review` returned `latest_candidates_need_passing_inspections`. A scan for any passing pair would have picked the old icon and reported success.

In a fresh job I generated the same passing pair. After inspection, I appended one byte to the icon and asked to package. This time I got `candidate_changed`, and there was no review manifest. Checking the hash at inspection time alone would have allowed that later file into the package. The evidence belongs to the inspected bytes as well as to the candidate ID.

## Replay a command without spending another attempt

A call ID also has a job here. The execution guard ran the same icon request twice with the same ID. The second call returned the first result and the generation-attempt counter stayed at one. Reusing that ID with different arguments produced `call_id_conflict`. The cache compares the tool name and serialized arguments. It covers replays inside the current process. A restart or a remote provider job would need durable request state and some way to recover an outstanding operation.

The successful run leaves a manifest that names the current files, their hashes, and the measured checks. Its state is `ready_for_review`. The alpha measurement tells me the icon has the requested background. I still want to see it on a selection card at its actual size. The peak measurement tells me the largest sample amplitude. I still want to hear the cue after an accepted reward. The manifest has separate fields for those approvals, and this run left them pending. The tool writes the manifest after copying the files. An interrupted copy can leave a review directory, so I look for the manifest before picking up the package.
