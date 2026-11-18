---
title: "When two documents become the same"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "data-modeling"]
summary: "Distdemo hashes prepared text, so two inputs can collapse to one document after redaction."
---

One test gives Distdemo two pieces of text. They differ by the address at the end.

```text
A readable document contact alice@example.invalid
A readable document contact bob@example.invalid
```

Both come out as `A readable document contact [EMAIL]`. The pipeline hashes that prepared text, so the mapper gives both documents the same key. If I hashed the input first, the two copies would stay separate and I'd write the same cleaned text twice. [The redaction and hashing test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/core/TextPreparationTest.java#L33-L37)

The shuffle brings matching keys together even when the inputs came from different files. The reducer writes one document and retains the number of copies. It also needs one source location for the output. It picks the smallest hashed source ID, breaking ties by byte offset. The choice is deterministic, even if a combiner groups the copies differently along the way. [The mapper and reducers](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L130-L173) · [The merge-order test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/hadoop/WritableTest.java#L27-L35)

In the export, `source_occurrences` appears on every chunk. A value of two means two accepted inputs collapsed to that document. Paraphrases still get separate keys whenever their prepared text differs. [The data contract](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/data-contract.md#identity-deduplication-and-splitting)

[More Distdemo articles](/tags/distdemo/)
