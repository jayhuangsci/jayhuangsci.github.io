---
title: "Where did the Hadoop tasks run?"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "yarn"]
summary: "YARN node registration says a worker is available. The job's attempt history says whether it processed the dataset."
---

I can run Distdemo on one machine and get good JSONL. I can also start a Compose project with two workers and see them both in the YARN dashboard. Those are two useful observations. There's still a question between them. When the files were produced, did any task actually run on the second worker?

The demo gives the scheduler work to divide. It generates 80 synthetic documents in 16 input shards, uploads them to HDFS, and submits two jobs with three reducers in the prepare stage. The script checks for two live DataNodes and two registered YARN workers before submitting. It saves the HDFS block report, the node list, and the corpus afterward. I can use the block report to show where input replicas were stored. That report alone cannot tell me who processed them. [The cluster script](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/deploy/cluster-demo.sh#L10-L34)

## Start from the result you're auditing

The audit begins with the manifest next to the actual JSONL. It expects two job IDs and a `yarn` framework value. For each ID it asks the MapReduce JobHistoryServer to confirm the job succeeded and completed maps. It then reads the successful attempts for that job's tasks. Each attempt has a node address. The audit matches the hostname to a worker the ResourceManager reports as `RUNNING` and keeps the job, task, attempt, and host in the report. [The audit's joins across the two services](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/tools/ClusterAudit.java#L22-L66)

The first successful cluster run produced these counts when I grouped the saved attempt report by stage and worker.

| Successful attempts | worker1 | worker2 |
| --- | ---: | ---: |
| Prepare maps | 9 | 7 |
| Deduplication reducers | 2 | 1 |
| Export maps | 2 | 1 |

The audit requires at least two execution hosts across the jobs. The table lets me make a stronger observation about this particular run. Each job used both. The output side also checks out. I re-read the six exported JSONL shards and found 219 distinct chunk IDs over 73 documents. Every document's chunks were in the same split, and each token array length matched its recorded range. One subtlety in the manifest is that Hadoop's generic `map_output_records` is zero for the second job. That mapper writes via named outputs. The pipeline records the export counts separately as 177 train and 42 validation chunks. [The successful run and its evidence bundle](https://github.com/jayhuangsci/distributedSysUtilsDemo/actions/runs/44188565590) · [Named output writes and counters](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L183-L209)

## One missing observation changed the deployment

An earlier attempt passed the local corpus check and failed the distributed job. The history service's health check asked `localhost:19888` inside its container. The service was listening at the Compose hostname. A one-line change pointed the probe at `historyserver:19888`, the address the other containers use. That fix let the deployment reach the audit instead of stopping at service readiness. [The earlier cluster failure](https://github.com/jayhuangsci/distributedSysUtilsDemo/actions/runs/44188064646/job/134410823368) · [The health-check change](https://github.com/jayhuangsci/distributedSysUtilsDemo/commit/7d0a1ec5ee6458a89c5c836807497f76e33e5ef1)

Both workers were containers on one CI host. The claim that survives the run is specific. Two distinct NodeManagers executed successful tasks for the dataset I inspected. To make a speedup claim I'd need a separate run designed to measure it. For this demo, the attempt report answers the question I started with.

[More Distdemo articles](/tags/distdemo/)
