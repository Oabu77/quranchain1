# Dar Ecosystem Play Apps

One Android source tree builds four Google Play application variants:

| Variant | Package ID | Connected service | Current scope |
|---|---|---|---|
| Wallet | `com.daralnas.wallet` | `https://wallet.darcloud.host/` | Non-financial budgeting research; no account or money movement |
| Logistics | `com.darcloud.logistics` | `https://logistics.darcloud.host/` | Internal interface preview using fictional data; no live logistics operations |
| MeshTalk | `com.darcloud.meshtalk` | `https://darcloud.host/meshtalk` | Direct and group text messaging beta; no end-to-end encryption, calls, media, or push notifications |
| QuranChain | `com.quranchain.rewards` | `https://quranchain.darcloud.host/` | Private, device-only prayer and Quran-reading tracker; no token rewards, mining, or financial value |

The apps enforce HTTPS, default ports, and flavor-specific internal path boundaries; disable WebView debugging, geolocation, content/file access, and third-party cookies; isolate external links; and show an unavailable screen for main-frame network or HTTP failures.

Current CI builds only unsigned debug APKs for MeshTalk and QuranChain Tracker; it does not read signing secrets, build release bundles, or upload to a store. A future manually approved release would require the existing persistent upload keystore, but the keystore and passwords must never be committed.

`com.quranchain.rewards` is a legacy technical package identifier retained for application-record continuity. It does not describe current functionality: this build has no token, rewards, mining, exchange, transfer, or financial feature.

The wrappers are suitable for closed testing only while their connected services remain pre-release. Digital purchases in Play-distributed builds must use Google Play Billing unless an applicable enrolled program permits another method.
