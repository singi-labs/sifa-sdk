---
'@singi-labs/sifa-sdk': patch
---

Extend `fontFallbackStacks.sans` and `fontFallbackStacks.display` with international script fallbacks (Noto Sans, Noto Sans Arabic/Devanagari/Thai/Hebrew) and OS-installed CJK fonts (Hiragino, Yu Gothic, PingFang SC/TC, Microsoft YaHei/JhengHei, Apple SD Gothic Neo, Malgun Gothic, Noto Sans CJK). Mirrors the chain shipped in sifa-web#1011. The brand font and generic terminator stay in the same positions; consumers depending on the existing stacks see additive entries only.
