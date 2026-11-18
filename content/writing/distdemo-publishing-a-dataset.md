---
title: "Publishing a finished Hadoop dataset"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "testing"]
summary: "A task can finish writing a shard before its dataset is ready. The requested path is the handoff after the manifest and shards are together."
---

Suppose I'm waiting for `/corpus/output/run-001`. The export job writes separate train and validation shards, one set of files per task. Somewhere in that process a task can finish and another can still fail. The output also needs a manifest with the two job IDs, the settings, and the counters. I want to give someone the final directory and have all of that make sense as one result.

The pipeline makes the path part of its contract. A successfully published run has a new destination. One invocation cannot reuse a destination that another run already owns. Until the final rename, the working directories belong to the invocation that created them. [The transaction constructor](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/OutputTransaction.java#L21-L35)

## Finish the content before giving it a name

The driver creates a hidden sibling with a UUID. Under that sibling the first job writes `deduplicated`, and the second writes `result`. Hadoop's commit protocol is responsible for the job output. After the export succeeds, the driver also checks for `result/_SUCCESS`, makes sure both split directories exist, and writes `_MANIFEST.json`. The success marker now travels with the artifacts it describes. [The two writes and publish call](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L63-L104) · [The publish method](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/OutputTransaction.java#L37-L45)

Only after closing the manifest does it call the filesystem for the final handoff.

```java
FileContext.getFileContext(destination.toUri(), configuration)
        .rename(result, destination, Rename.NONE);
```

The early existence check saves work on an obviously occupied destination. It would be insufficient on its own. Another job may create that name while the first one is still processing. The HDFS handoff uses a rename without overwrite so an existing dataset can win that race and keep its path. Staging next to the destination keeps the rename on the same filesystem. The driver currently admits HDFS and the local filesystem. An object store would need a publication protocol designed around its own operations. [The filesystem checks and rename](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/OutputTransaction.java#L21-L47)

## Make the caller's failure observable

I start with two failure cases in the integration test. One creates the destination first with a file named `keep.txt`. The call must fail and the file must still read `preserved`. The other submits a missing input. Afterwards the destination and the invocation's temporary workspace must both be absent. These are checks on the filesystem after the error. A test that only expected an exception would allow a partial result to stay visible. [The occupied destination and failed-input cases](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/PipelineIntegrationTest.java#L135-L146)

The empty-input case matters for the other direction. It should produce a published directory and a passing inspection with zero rows. Treating “found shards” as the commit signal would lose that distinction. An empty result can be a valid dataset. [The empty-input case](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/PipelineIntegrationTest.java#L148-L154)

There is still a gap between committing the output and telling the caller. A process killed before rename can leave its hidden workspace behind. A process killed just after rename can leave a valid dataset even though the caller never got the final success message. In that second case, submitting the same path again will find it already occupied. The useful question is whether the destination has the expected manifest and passes inspection. That receipt lives with the data, across the lifetime of the driver that wrote it. [The cleanup and publication sequence](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/architecture.md#output-publication) · [The inspector](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/tools/CorpusInspector.java)

[More Distdemo articles](/tags/distdemo/)
