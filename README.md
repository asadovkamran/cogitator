Cogitator console inspired by WH40k. Runs locally and uses ollama + qwen2.5:0.5b to generate occasional machine-spirit whispers.

Inference is offline. No calls are made beyond localhost.
CUDA/ROCm/Vulkan backeds were stripped out to reduce package weight. Inference happens on CPU and it's enough for this kind of task.
Cogitator has 4 phases or moods: IGNITION, LITANY, DIAGNOSTIC, CORRUPTION. Each phase comes with it's own boot logs, hex dumps, prayers and etc. Whenever CORRUPTION level gets higher screen glitches get more often.
It behaves like a screensaver.
WebGL rendering is used for making it look like it happens on a CRT-style monitor.

You will probably get SmartScreen warnings because this build is unsigned. Just run it anyway, it wont harm you. It's an Electron app and AVs don't like Electron apps.

<img width="800" height="600" alt="Screenshot 2026-08-12 223430" src="https://github.com/user-attachments/assets/38d8bf4d-0fe0-4016-af41-5e82c0d35296" />
