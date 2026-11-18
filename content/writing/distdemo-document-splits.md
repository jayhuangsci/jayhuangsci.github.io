---
title: "One document, one split"
date: 2026-11-17
draft: false
tags: ["distdemo", "hadoop", "data-modeling"]
summary: "An overlapping window can put the same phrase in two rows. The document hash decides where both rows go."
---

Take the string `one two three four five six seven`. With a window of four and one token of overlap, Distdemo produces these rows. The ranges are zero-based and the end is exclusive. [The overlap test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/core/TextPreparationTest.java#L66-L80)

| Chunk | Token range | Text |
| --- | --- | --- |
| 0 | `[0, 4)` | one two three four |
| 1 | `[3, 7)` | four five six seven |

If I split the rows independently, they could go to different datasets. The example only repeats *four*. In a real document the overlap can carry a sentence or its context. Even windows with zero overlap could still put different sections of the same page on opposite sides. The grouping I care about is the prepared document.

## Split before the window moves

The export mapper receives one deduplicated document. It takes the first 64 bits of its SHA-256 digest, treats them as an unsigned integer, and reduces that number modulo 100. A bucket below `validation_percent` goes to validation. The mapper decides once and captures the result in the function that writes the chunks. Every window then inherits that same value. [The bucket function](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/core/Hashes.java#L19-L27) · [The export mapper](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/hadoop/CorpusPipeline.java#L183-L205)

The checked-in sample makes this testable without Hadoop. Its document ID starts with `3191cdea24c9036a`. Read unsigned, that prefix falls into bucket 14. The sample was exported with a 50 percent threshold, so the row belongs to validation. At 10 percent the same document would go to train. The seven documents in the tiny demo divide into four train and three validation documents. Their rows divide 7 to 6 because a document can yield multiple windows. The percentage controls the number of buckets, and the corpus determines how many documents and rows land in them. [The sample record](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/examples/training-record.json) · [The sample run parameters and counts](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/docs/examples/README.md)

## The end of a window is easy to get wrong

When a window fills, the tokenizer emits it and retains just the configured overlap in its deque. Consider a document with exactly four tokens, a window of four, and an overlap of two. After emitting the sole full window, the deque still contains two tokens. A flush that only checks whether the deque is nonempty would output them again as a second, entirely redundant chunk. The implementation records the end of the last emitted window and only flushes if new tokens arrived after that point. The test with exactly four tokens expects one row. [The tokenizer loop](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/core/TextTokenizer.java#L25-L45) · [The trailing-window test](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/test/java/io/github/jayhuangsci/corpus/core/TextPreparationTest.java#L75-L80)

There are two identifiers worth keeping straight. The document ID identifies the prepared text. The chunk ID adds a chunk index and a fingerprint of the schema, lexical tokenizer, window size, and overlap. Changing the overlap changes the chunk IDs. Changing the split threshold changes where some rows go while their IDs stay the same. An ID comparison by itself would miss that reassignment. I check the split and offsets in the actual records and keep the run parameters in the manifest. [Window fingerprint](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/core/PipelineOptions.java#L80-L90) · [The inspector](https://github.com/jayhuangsci/distributedSysUtilsDemo/blob/67741320b1d918157aeb032e77d9de616f8606e4/src/main/java/io/github/jayhuangsci/corpus/tools/CorpusInspector.java)

The check I can make is narrow and useful. Each exact prepared document stays together, and every chunk points back to it. A near copy with a different prepared-text hash can still land in the other split. The definition of “same document” is the part I'd have to revisit for a corpus made up of lightly revised copies of the same articles.

[More Distdemo articles](/tags/distdemo/)
