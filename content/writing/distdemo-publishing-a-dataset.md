---
title: "Publishing a finished Hadoop dataset"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "testing"]
summary: "Both jobs finish and the manifest is written before the output gets its requested path."
---

I want to be able to hand someone the path to a Distdemo dataset as soon as the pipeline returns. They should find the shards and a manifest that describes exactly those shards. The export job itself writes files before it has finished, so the path I give the reader has to mean something more than “a task wrote here.”

Both jobs write under a hidden sibling directory with a fresh UUID. The second job writes `_SUCCESS` once its output is committed. The driver checks for that marker, creates any missing split directory, and writes `_MANIFEST.json` into the result. Only then does it rename the result to the requested destination. [The publish method](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/OutputTransaction.java#L21-L47)

There are two opportunities to find that the name is taken. The first check runs before any jobs start. At publish time, `Rename.NONE` asks the filesystem to refuse replacement if another invocation has since claimed the path. Each invocation cleans up its own staging directory.

The integration test puts a `keep.txt` file in an existing destination and tries to publish there. The call fails and the file still says `preserved`. Then it submits a nonexistent input and checks that the requested destination and the temporary workspace are both absent. A hard kill can strand a hidden workspace, but a reader can keep using the requested path as the point of handoff. [The failure cases](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/PipelineIntegrationTest.java#L135-L146) · [Supported filesystems and cleanup](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/architecture.md#output-publication)

[More Distdemo articles](/tags/distdemo/)
