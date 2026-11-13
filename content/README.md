# Content

Text that ships with the app. All of it is written or edited with the `field-editor` agent and uses fictional places and organisations only.

| File | Purpose | Created in |
|---|---|---|
| `sample-flood.json`, `sample-water.json`, `sample-urgent.json` | Sample issues for the simulator, tests and demos | M4 |
| `dictionary-v1.txt` | Source of the compression dictionary. Frozen once it ships: changes go into a new `dictionary-v2.txt` | M4 |
| `templates/` | Page templates for the Station (weather warning, shelter list, water and food points, clinic hours) | M6 |
| `samples/*.wav` | A few hand-picked audio samples kept in the repository (other `.wav` files are git-ignored) | M7 |

A page in a sample issue looks like this:

```json
{
  "number": 101,
  "lang": "en",
  "title": "River level warning",
  "lines": ["Line one, up to 40 characters", "Line two"],
  "priority": 2,
  "rtl": false
}
```

Limits: title up to 32 characters, up to 15 body lines of up to 40 characters, 640 characters in total, page numbers 100 to 899, priority 0 (normal) to 3 (urgent).
