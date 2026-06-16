import { parseSRT } from "@captions/cue-engine";

const srt = `1
00:00:00,120 --> 00:00:00,900
Welcome back.

2
00:00:00,930 --> 00:00:02,760
So the first pattern we'll take a look at.

3
00:00:02,940 --> 00:00:05,460
It's not really called frequency counters.

4
00:00:05,760 --> 00:00:10,350
I don't think it's actually called anything officially, but that's the name I'm using, because the

5
00:00:10,350 --> 00:00:18,060
idea behind it is that we use an object usually in JavaScript to basically collect a bunch of values

6
00:00:18,060 --> 00:00:19,350
and their frequencies.

7
00:00:19,350 --> 00:00:25,140
So this is useful in, in, in algorithms and challenges when you have multiple pieces of data, multiple

8
00:00:25,140 --> 00:00:32,910
inputs, and you need to compare them to see if they consist of similar values, if they are anagrams

9
00:00:32,910 --> 00:00:38,070
of one another, if a value is contained inside of another value, any time you're comparing pieces

10
00:00:38,070 --> 00:00:44,280
of data to inputs or more than two and frequencies of certain things occurring, and I know that sounds

11
00:00:44,280 --> 00:00:48,360
really wishy washy and not that useful, but I'll show you a couple of examples.`;

console.log(parseSRT(srt, { stopOnFirstError: true, allowEmptyText: false, validateOrder: true }));
