---
title: "One document, one split"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "data-modeling"]
summary: "Distdemo assigns train or validation to the whole document, then writes all its overlapping chunks there."
---

If I chunk the sentence `one two three four five six seven` into windows of four tokens with one token of overlap, I get two rows.

| Token range | Chunk |
| --- | --- |
| `[0, 4)` | one two three four |
| `[3, 7)` | four five six seven |

The word *four* is in both. With a real document the shared text could be a phrase, and the two rows still came from the same source. I want them to go to the same side of the train/validation split. [The overlap test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/core/TextPreparationTest.java#L66-L80)

Distdemo decides where to send a document once, from the hash of its prepared text. The export mapper uses that choice for every chunk it writes from that document. Exact duplicates have already collapsed to the same document. A rewrite with different prepared text gets its own hash and can land on the other side. [The export mapper](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L183-L205)

The small demo sets validation to 50 percent. Four unique documents went to train and three to validation, so the shards contain seven and six chunks respectively. The percentage sets the share of hash buckets assigned to validation. How many rows turn up in each split depends on the hashes and how long those documents are. [The demo counts](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/examples/README.md)

[More Distdemo articles](/tags/distdemo/)
