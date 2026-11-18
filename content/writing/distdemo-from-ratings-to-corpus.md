---
title: "From movie ratings to training text"
date: 2026-11-17
draft: false
featured: true
tags: ["distdemo", "hadoop", "architecture"]
summary: "Distdemo went from comparing Hadoop and Spark ratings jobs to producing a dataset I could inspect one line at a time."
---

Distdemo's first commit had Hadoop and Spark word counts and a set of movie-rating exercises. The ratings lab that grew out of it ran the same analysis on both engines. I could compute statistics, find similar items, and compare the results. That version now has a name in Git, `ratings-lab-v1.0.0`. [The first commit](https://github.com/jayhuangsci/distributedSysUtilsDemo/commit/6f7d1c005451efee29422e4fe0eb0f50ea30075a) · [The ratings lab](https://github.com/jayhuangsci/distributedSysUtilsDemo/tree/ratings-lab-v1.0.0)

The next version gave the batch job a different end product. I wanted a folder of training examples I could open and check. The inputs would be plain text or HTML, and each output line would be a JSON object with cleaned text, a document ID, and enough metadata to see where the chunk came from. [The corpus pipeline commit](https://github.com/jayhuangsci/distributedSysUtilsDemo/commit/322450f5bce61f09966c80cc52abb2edf91b1c75)

Two Java MapReduce jobs do the work. The first extracts and cleans text, then sends copies with the same prepared-text hash to one reducer. It writes distinct documents to SequenceFiles. The second reads those files and writes chunks into train and validation JSONL shards. The export is a map-only job because each document already has everything that step needs. [The handoff between the two jobs](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L63-L91)

The small checked-in example gives me numbers I can check by hand. Twelve inputs yielded nine accepted documents. Two duplicate copies brought that down to seven unique documents, which became thirteen JSONL chunks. One of those rows has `[PHONE]` and `[IP]` where the synthetic input had a phone number and an address. That's the point at which I can open a line and see what changed. [Sample run and counts](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/examples/README.md) · [The sample record](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/examples/training-record.json)

[More Distdemo articles](/tags/distdemo/)
