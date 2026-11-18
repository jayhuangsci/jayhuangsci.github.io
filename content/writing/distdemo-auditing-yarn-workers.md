---
title: "Where did the Hadoop tasks run?"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "yarn"]
summary: "A two-worker cluster looks ready when both workers register. Job history shows which ones actually did the work."
---

A YARN worker can register and sit idle. When I put two workers in Distdemo's Compose setup, I wanted to know where the maps and reducers actually ran.

The demo puts 80 synthetic documents in 16 input files on HDFS. When the pipeline finishes, its manifest gives the audit program two job IDs to look up. The program checks both jobs in JobHistoryServer, collects the hosts of successful task attempts, and checks them against workers marked `RUNNING` by the ResourceManager. The audit requires successful work on at least two hosts. [The cluster demo](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/README.md#run-on-a-two-worker-hdfsyarn-cluster) · [The audit code](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/tools/ClusterAudit.java)

Here's what the first green distributed run recorded in `deployment-audit.json`. [The CI run with the audit artifact](https://github.com/jayhuangsci/distributedSysUtilsDemo/actions/runs/44188565590)

| Successful tasks | worker1 | worker2 |
| --- | ---: | ---: |
| Prepare maps | 9 | 7 |
| Deduplication reducers | 2 | 1 |
| Export maps | 2 | 1 |

Getting that report required a fix to the health check. The history service was being probed on localhost inside its container, although the service was bound to its Compose hostname. The fix changed the probe to ask the address where it was actually listening. [The health-check fix](https://github.com/jayhuangsci/distributedSysUtilsDemo/commit/7d0a1ec5ee6458a89c5c836807497f76e33e5ef1)

Both workers were containers on one CI machine. The result I can point to is the task placement in that run, down to which worker handled each stage.

[More Distdemo articles](/tags/distdemo/)
