---
title: "When two documents become the same"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "data-modeling"]
summary: "The duplicate key comes from the text readers receive. A reducer has to preserve a count and a deterministic source through any grouping of those copies."
---

The point at which I take a hash changes what the application thinks a duplicate is. In this test, two inputs end in different email addresses. After preparation they both end in `[EMAIL]`. They receive the same content key. Hashing the raw lines first would have carried both into the corpus even though they had become the same text. [The two-address test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/core/TextPreparationTest.java#L33-L37)

```text
A readable document contact alice@example.invalid
A readable document contact bob@example.invalid

A readable document contact [EMAIL]
```

HTML extraction, Unicode normalization, whitespace handling, and pattern redaction all happen before the hash. This is exact equality of **prepared text**. Two paraphrases can still produce two rows. Two documents whose meaningful differences were masked can collapse. What the pipeline chooses to remove is part of the identity rule. [The processing order](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/core/TextProcessor.java#L23-L55) · [The mapper's key](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L130-L151)

## What can a combiner replace three rows with?

Once the key matches, I need to remember how many copies there were and have one source location to put in the export. Hadoop can combine values on the mapper side before shuffling them. It can also send the original values straight to the reducer. The answer has to survive either grouping. [Hadoop's map and reduce interface](https://hadoop.apache.org/docs/r3.4.2/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html#Mapper)

The merge operation adds the occurrence counts and selects the minimum source location, ordered first by hashed path and then by byte offset. The winning value supplies the representative's other metadata. Addition and minimum give the same answer however these equal-key values are grouped. The function also compares their text and fails if the key has somehow put unequal text together. The hash gets records to the same reducer. The text comparison prevents a suspect group from silently claiming that the documents are equal. [The merge implementation](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/PreparedDocumentWritable.java#L24-L45)

The test uses three source locations, `(z, 12)`, `(a, 25)`, and `(a, 5)`. Both `(a.merge(b)).merge(c)` and `a.merge(b.merge(c))` yield three occurrences and source `(a, 5)`. It also asserts that the original value still has just one occurrence. That matters when one temporary value is used as input to more than one merge. [The merge-order test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/WritableTest.java#L27-L35)

## Count the right thing

An exported chunk carries `source_occurrences` and `document_redactions`. The former is the number of accepted inputs that collapsed to its document. The latter comes from the selected representative. If one copy already contains the literal placeholder `[EMAIL]` and another gets that placeholder through redaction, the same prepared text can have representatives with different redaction counts. The mapper's run-level counters count actual replacements across accepted inputs before merging. Summing the per-chunk metadata would count some documents several times and miss replacements made in copies that lost the representative selection. [Counters before the shuffle](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L138-L151) · [The exported fields](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L183-L205)

In the 24-document fixture the combiner counters were 24 in and 24 out. The reducers emitted 20. A local combiner only has the batch it's handed. It is the shuffle by the exact key, followed by that same merge for the complete group, that gives the pipeline global deduplication. [The reducer-count comparison in CI](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/PipelineIntegrationTest.java#L62-L90)

[More Distdemo articles](/tags/distdemo/)
