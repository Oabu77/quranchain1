# Dar Ecosystem Play Apps

One Android source tree builds four Google Play application variants:

| Variant | Package ID | Connected service |
|---|---|---|
| Wallet | `com.daralnas.wallet` | `banking.darcloud.host` |
| Logistics | `com.darcloud.logistics` | `logistics.darcloud.host` |
| MeshTalk | `com.darcloud.meshtalk` | `fungios.darcloud.host` |
| QuranChain | `com.quranchain.rewards` | `darcloud.host` |

The apps enforce HTTPS, disable WebView debugging and geolocation by default, isolate external links, support image selection, and include an offline recovery screen.

Release builds require a persistent upload keystore. Never commit the keystore or passwords. CI expects `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` repository secrets.

The wrappers are suitable for closed testing only while their connected services remain pre-release. Digital purchases in Play-distributed builds must use Google Play Billing unless an applicable enrolled program permits another method.
