# Flappy NeuroLab — Multi-Topology, Multi-Optimizer & Mechanistic Policy Research Report

Generated: 2026-11-19T09:37:38.026Z

## 1. Experimental Protocol
- **Mastery Score Limit**: 10,000 pipes per unseen course
- **Max Generations / Trial**: Unlimited (until verified perfect)
- **Stagnation Early-Stop**: 15 stagnant generations (after Gen 15)
- **Stress-Test Verification**: 5 deterministic PRNG seeds per candidate audit (fail-fast mid-trial)
- **Timing Normalization**: Hardware-independent Normalized Compute Time (norm-ms at 10M synaptic ops/s) + Bird-Episodes (Pop × Gen) alongside sleep-clamped active CPU time
- **Optimization Methods (8)**: Genetic Algorithm (GA), Natural ES (Antithetic), Adam-NES (Momentum ES), Adaptive (1+λ) ES, Cross-Entropy Method (CEM), Differential Evolution (DE), Particle Swarm (PSO), Neuro-CMA Hybrid (Custom)
- **Network Topologies (25)**: 5→1 (0n, 5w, 6p), 5→2→1 (2n, 12w, 15p), 5→4→1 (4n, 24w, 29p), 5→8→1 (8n, 48w, 57p), 5→16→1 (16n, 96w, 113p), 5→4→4→1 (8n, 40w, 49p), 5→8→4→1 (12n, 76w, 89p), 5→8→8→1 (16n, 112w, 129p), 5→6→6→4→1 (16n, 94w, 111p), 5→2→2→1 (4n, 16w, 21p), 5→1→3→1 (4n, 11w, 16p), 5→1→1→1→1→1 (4n, 9w, 14p), 5→2→2→2→1 (6n, 20w, 27p), 5→2→4→1 (6n, 22w, 29p), 5→3→2→1 (5n, 23w, 29p), 5→6→1 (6n, 36w, 43p), 5→4→2→1 (6n, 30w, 37p), 5→2→6→1 (8n, 28w, 37p), 5→6→2→1 (8n, 44w, 53p), 5→4→2→2→1 (8n, 34w, 43p), 5→2→4→2→1 (8n, 28w, 37p), 5→2→2→2→2→1 (8n, 24w, 33p), 5→4→4→2→1 (10n, 46w, 57p), 5→6→2→6→1 (14n, 60w, 75p), 5→12→4→1 (16n, 112w, 129p)
- **Population Sizes**: 60, 150, 300, 500
- **Environmental Scenarios**: Easy, Standard, Hard

## 2. Executive Abstract & Compute-Normalized Findings
Executed 7200 controlled trials across 25 network topologies (depth 0–4) and 3 physics scenarios up to 10,000 pipes/seed (5 unseen seeds per audit). 6670 of 7200 configurations (93%) verified zero-crash perfection across every unseen course. Most compute-efficient perfection: 4.8 norm-ms (60 bird-evals, G1) by PSO on 5→1 (6p) in Standard. Peak knowledge compression: 1,666.67 pipes/param (10,000 worst-case pipes in 6 weights via 5→1).

Easy: zero-crash perfection achieved with 6p (5→1, CEM, 39.1 norm-ms, 1,050 evals). Standard: zero-crash perfection achieved with 6p (5→1, CEM, 171.5 norm-ms, 900 evals). Hard: zero-crash perfection achieved with 6p (5→1, Natural ES, 35.3 norm-ms, 500 evals).

Shallow architectures (Depth 0–1) averaged 94% perfection rate (9,427 mean pipes), whereas deeper multi-layer networks (Depth 2–3) averaged 92% perfection rate (9,230 mean pipes). Compact shallow policies preserve high signal-to-noise credit assignment under gradient-free search.

Iso-Parameter (~15p): 5→2→1 (2n, D1) outperformed 5→1→1→1→1→1 (4n, D4) with 91% vs 76% perfection and 9,078 vs 7,624 mean pipes (1.05s vs 1.81s). Iso-Parameter (~29p): 5→4→1 (4n, D1) outperformed 5→2→2→2→1 (6n, D3) with 95% vs 91% perfection and 9,557 vs 9,065 mean pipes (1.56s vs 1.81s). Iso-Neuron (4 hidden neurons): lean 5→1→1→1→1→1 (9 weights, D4) achieved 76% perfection (7,624 mean pipes) vs dense 5→4→1 (24 weights, D1) at 95% (9,557 mean pipes).

**Hyperparameter Sweet Spot:** Best empirical configuration: PSO with Pop 150 and Sigma 0.30 (100% perfection across 75 trials, mean 10,000 pipes, avg 552 bird-evals / 751.0 norm-ms).

**How Winning Networks Work:** Across 6670 top policies, decision sensitivity concentrates on Bot Clear (38%) and Top Clear (30.1%), while Bird Y accounts for only 8.3%. Average weight L2 norm is 4.51 with 12% near-zero synapses. Sample verified 5→1 control law: Flap if 0.39·Y - 0.04·Vy + 0.10·DX - 0.02·Top - 1.07·Bot + 0.25 > 0.

## 3. Optimization Method Comparison (Hardware-Independent Compute & Adaptation)
| Method | Trials | Perfect | Rate | Static Perf % | Dynamic Perf % | Avg Compute (norm-ms) | Avg Bird-Evals | Avg Gens | Mean Min-Seed |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Genetic Algorithm (GA) | 900 | 893 | 99% | 99% | — | 1498.4 ms | 1,047 | 5 | 9,933 |
| Natural ES (Antithetic) | 900 | 753 | 84% | 84% | — | 2532.6 ms | 2,438 | 10.5 | 8,381 |
| Adam-NES (Momentum ES) | 900 | 756 | 84% | 84% | — | 3169.5 ms | 2,324 | 10.1 | 8,429 |
| Adaptive (1+λ) ES | 900 | 795 | 88% | 88% | — | 1805.1 ms | 1,081 | 4.9 | 8,840 |
| Cross-Entropy Method (CEM) | 900 | 818 | 91% | 91% | — | 1813.3 ms | 1,867 | 8 | 9,113 |
| Differential Evolution (DE) | 900 | 889 | 99% | 99% | — | 1118.7 ms | 802 | 4 | 9,888 |
| Particle Swarm (PSO) | 900 | 881 | 98% | 98% | — | 1136.8 ms | 812 | 3.9 | 9,796 |
| Neuro-CMA Hybrid (Custom) | 900 | 885 | 98% | 98% | — | 1793.1 ms | 1,117 | 5.3 | 9,836 |

## 4. Network Topology Scaling (Neurons × Weights × Compute Cost)
| Topology | Depth | Neurons | Weights | Params | Perfect Rate | Mean Min-Seed | Max Density (p/w) | Avg Compute (norm-ms) | Avg Bird-Evals |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 5→1 | 0 | 0 | 5 | 6 | 90% (260/288) | 9,034 | 1666.67 | 253 ms | 1,334 |
| 5→2→1 | 1 | 2 | 12 | 15 | 91% (261/288) | 9,078 | 666.67 | 626.4 ms | 1,164 |
| 5→4→1 | 1 | 4 | 24 | 29 | 95% (275/288) | 9,557 | 344.83 | 1220.7 ms | 1,191 |
| 5→8→1 | 1 | 8 | 48 | 57 | 95% (273/288) | 9,480 | 175.44 | 1716.8 ms | 1,076 |
| 5→16→1 | 1 | 16 | 96 | 113 | 97% (280/288) | 9,725 | 88.5 | 3857.6 ms | 1,099 |
| 5→4→4→1 | 2 | 8 | 40 | 49 | 97% (278/288) | 9,670 | 204.08 | 1858.1 ms | 1,262 |
| 5→8→4→1 | 2 | 12 | 76 | 89 | 97% (278/288) | 9,662 | 112.36 | 3968.9 ms | 1,407 |
| 5→8→8→1 | 2 | 16 | 112 | 129 | 94% (272/288) | 9,450 | 77.52 | 3753.5 ms | 1,226 |
| 5→6→6→4→1 | 3 | 16 | 94 | 111 | 93% (269/288) | 9,378 | 90.09 | 3238.8 ms | 1,314 |
| 5→2→2→1 | 2 | 4 | 16 | 21 | 95% (274/288) | 9,515 | 476.19 | 991.2 ms | 1,613 |
| 5→1→3→1 | 2 | 4 | 11 | 16 | 87% (251/288) | 8,721 | 625 | 698.4 ms | 1,683 |
| 5→1→1→1→1→1 | 4 | 4 | 9 | 14 | 76% (219/288) | 7,624 | 714.29 | 724.6 ms | 2,077 |
| 5→2→2→2→1 | 3 | 6 | 20 | 27 | 91% (261/288) | 9,065 | 370.37 | 1071.3 ms | 1,663 |
| 5→2→4→1 | 2 | 6 | 22 | 29 | 94% (271/288) | 9,420 | 344.83 | 1584.7 ms | 1,681 |
| 5→3→2→1 | 2 | 5 | 23 | 29 | 93% (267/288) | 9,309 | 344.83 | 1189.2 ms | 1,506 |
| 5→6→1 | 1 | 6 | 36 | 43 | 97% (279/288) | 9,688 | 232.56 | 2292.4 ms | 1,208 |
| 5→4→2→1 | 2 | 6 | 30 | 37 | 94% (270/288) | 9,398 | 270.27 | 1165.7 ms | 1,249 |
| 5→2→6→1 | 2 | 8 | 28 | 37 | 93% (269/288) | 9,342 | 270.27 | 1310.1 ms | 1,474 |
| 5→6→2→1 | 2 | 8 | 44 | 53 | 98% (281/288) | 9,767 | 188.68 | 1645.5 ms | 1,246 |
| 5→4→2→2→1 | 3 | 8 | 34 | 43 | 91% (262/288) | 9,098 | 232.56 | 1369.8 ms | 1,411 |
| 5→2→4→2→1 | 3 | 8 | 28 | 37 | 89% (255/288) | 8,855 | 270.27 | 1170.5 ms | 1,470 |
| 5→2→2→2→2→1 | 4 | 8 | 24 | 33 | 87% (251/288) | 8,731 | 303.03 | 1450.5 ms | 1,851 |
| 5→4→4→2→1 | 3 | 10 | 46 | 57 | 93% (269/288) | 9,366 | 175.44 | 1708 ms | 1,340 |
| 5→6→2→6→1 | 3 | 14 | 60 | 75 | 93% (269/288) | 9,395 | 133.33 | 2480.6 ms | 1,512 |
| 5→12→4→1 | 2 | 16 | 112 | 129 | 96% (276/288) | 9,597 | 77.52 | 3503.9 ms | 1,140 |

## 5. Minimum Parameters for Verified Perfection by Scenario
| Scenario | Perfect Runs | Min Perfect Topology | Compute Cost (norm-ms) | Bird-Evals | Worst-Case Best Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Easy | 2310/2400 | 5→1 (6p, CEM) | 39.1 ms | 1,050 | 10,000 |
| Standard | 2253/2400 | 5→1 (6p, CEM) | 171.5 ms | 900 | 10,000 |
| Hard | 2107/2400 | 5→1 (6p, Natural ES) | 35.3 ms | 500 | 10,000 |

## 6. Mechanistic Policy Attribution (How Trained Networks Fly)
| Sensor Input | Mean Attribution (%) |
| :--- | :---: |
| Bird Y | 8.3% |
| Vel Vy | 10.2% |
| Pipe DX | 13.4% |
| Top Clear | 30.1% |
| Bot Clear | 38% |

- **Sample Verified 5→1 Decision Boundary**: `Flap if 0.39·Y - 0.04·Vy + 0.10·DX - 0.02·Top - 1.07·Bot + 0.25 > 0`
- **Mean Weight L2 Norm**: 4.51 · **Near-Zero Synapses (<0.08)**: 12%

## 7. Implications for World Models & Complex Agents (e.g. 3D/Minecraft)
- Static Control Convergence: Across 7200 completed static-physics trials, Genetic Algorithm (GA) achieved 99% perfection (avg 9,933 pipes). Dynamic/gust trials have not completed yet — focus the next sweep on dynamic/moving-pipe scenarios.
- Latent Controller Bottleneck Sizing (Hardware-Independent): Depth 0–1 controllers needed 1661.1 norm-ms of synaptic compute vs 1836.0 norm-ms for Depth 2+ networks (1.1× compute cost). For high-dimensional games like Minecraft, keeping the policy controller narrow over compact World Model latents minimizes sample complexity.
- Generalization vs. Memorization Ratio: Across 7200 trials, unseen-seed worst-case retention averaged 96% of peak training score. Multi-seed audits prevent overfitting to deterministic transition seeds.

## 8. Complete Trial Appendix
| Method | Scenario | Topology | Depth | Neurons | Weights | Params | Pop | Mut Str | Min Seed | Outcome | Bird-Evals | Norm Compute (ms) | Dominant Sensor | Density |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 14.7 | Pipe DX | 0 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 48.4 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 171.5 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 27.0 | Top Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 99.9 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 16.3 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 18.7 | Vel Vy | 0 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 28.2 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 24.2 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 148.4 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 52.5 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 15.3 | Top Clear | 0 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 179.4 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 16.4 | Top Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 176.6 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 18.2 | Vel Vy | 0 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 292.3 | Top Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G16) | 960 | 63.2 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 493.4 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 0 | STAGNATED (G29) | 1740 | 35.4 | Top Clear | 0 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 64.4 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 20.3 | Bird Y | 0 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 172.5 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 26.3 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 19.4 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 34.7 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 35.5 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 442.3 | Top Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 249.3 | Top Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 88.9 | Top Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 189.5 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 30.1 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 18.9 | Bot Clear | 0 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 395.0 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 0 | STAGNATED (G48) | 2880 | 55.2 | Top Clear | 0 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 43.0 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 191.5 | Top Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 22.1 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 4.8 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 31.9 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 137.9 | Vel Vy | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 290.4 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 21.2 | Top Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 140.0 | Top Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 202.1 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 102.0 | Top Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 22.4 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 43.9 | Bot Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 94.9 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 253.0 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 18.0 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 1102 | STAGNATED (G23) | 1380 | 214.6 | Bot Clear | 183.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 908.5 | Pipe DX | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 13.5 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 22.3 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 156.9 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G29) | 1740 | 162.0 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 40.7 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 15.6 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 15.3 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 6.0 | Top Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 92.0 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 63.5 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 22.9 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 102.9 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 48.2 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 40.1 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 115.9 | Bot Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 8.1 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 18.8 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 13.9 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 14.3 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 178.5 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 775.1 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 56.7 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 227.9 | Top Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 88.2 | Top Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 37.9 | Top Clear | 0 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 39.1 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 8.7 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G44) | 6600 | 1488.8 | Top Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G26) | 3900 | 1131.7 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 170.4 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 173.6 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 47.3 | Bot Clear | 0 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 98.9 | Top Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 34.0 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 65.6 | Top Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 47.5 | Top Clear | 0 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 25.5 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 199.4 | Top Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 0 | STAGNATED (G41) | 6150 | 121.2 | Pipe DX | 0 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 0 | STAGNATED (G22) | 3300 | 332.8 | Vel Vy | 0 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 36.8 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 138.8 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 130.4 | Top Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 9.0 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 14.1 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 67.1 | Top Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 54.9 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 15.6 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 246.7 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 0 | STAGNATED (G17) | 2550 | 40.5 | Pipe DX | 0 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 97.2 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 50.4 | Top Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 320.6 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 154.7 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 19.1 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 289.9 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 186.5 | Top Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 108.2 | Top Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 50.5 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 39.7 | Top Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 289.2 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 72.0 | Bot Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 39.1 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 29.1 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 26.3 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 72.1 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 10.8 | Vel Vy | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 24.5 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 59.5 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 235.8 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 182.8 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 181.1 | Top Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 23.3 | Top Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 104 | STAGNATED (G17) | 2550 | 351.2 | Bot Clear | 17.33 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 8.2 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 147.0 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 9.5 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 54.2 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 139.9 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 342.9 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 8.7 | Top Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 184.4 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 53.5 | Top Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 78.2 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 366.1 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 7.6 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 11.0 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 11.1 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 33.5 | Top Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 23.1 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 35.0 | Pipe DX | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G29) | 8700 | 266.5 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 27.1 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 13.9 | Top Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 18.8 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 16.3 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G20) | 6000 | 898.6 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 59.7 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 381.7 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 94.8 | Bird Y | 0 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 202.8 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 854.1 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 93.5 | Vel Vy | 0 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 88.7 | Top Clear | 0 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 208.9 | Top Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 343.8 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 20.9 | Top Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G22) | 6600 | 2294.3 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 227.3 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 667.9 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 0 | STAGNATED (G18) | 5400 | 100.5 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 57.5 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 59.3 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 208.6 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 10.3 | Top Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 18.6 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 206.8 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 103.2 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 1709.7 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 19.7 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 12.7 | Top Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G32) | 9600 | 398.3 | Top Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 186.8 | Top Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 49.4 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 837.0 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 175.2 | Top Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 0 | STAGNATED (G23) | 6900 | 136.2 | Pipe DX | 0 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 18.6 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 0 | STAGNATED (G16) | 4800 | 94.5 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 16.2 | Top Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2876.5 | Bot Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 109.1 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1149.9 | Top Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 410.9 | Top Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 165.4 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 83.5 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 79.9 | Top Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 175.0 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 30.8 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 595 | STAGNATED (G24) | 7200 | 737.1 | Pipe DX | 99.17 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 13.8 | Pipe DX | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 52.1 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 113.0 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 179.0 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 0 | STAGNATED (G21) | 6300 | 121.5 | Pipe DX | 0 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 31.8 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 24.2 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 22.8 | Top Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 79.2 | Top Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 16.0 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G18) | 5400 | 994.4 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 131.0 | Top Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 2202.2 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 98.9 | Top Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 73.7 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 72.3 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 389.0 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 17.2 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 57.3 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 33.6 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 158.4 | Top Clear | 0 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 0 | STAGNATED (G25) | 12500 | 1272.6 | Bot Clear | 0 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 156.7 | Vel Vy | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 40.0 | Top Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 55.8 | Top Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 124.6 | Bot Clear | 0 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 143.0 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 41.5 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 516.4 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 134.0 | Top Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 555.6 | Top Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 767.9 | Top Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 651.0 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 369.4 | Top Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 198.5 | Top Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 232.2 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 287.2 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 400.2 | Top Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 307.7 | Top Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G25) | 12500 | 571.3 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 571.8 | Top Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 720.9 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 39.8 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 18.5 | Top Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 27.5 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 88.8 | Bot Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G19) | 9500 | 1195.4 | Bot Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 230.5 | Bot Clear | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 74.3 | Top Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 27.5 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.15 | 10000 | Perfect (G41) | 20500 | 3804.2 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G18) | 9000 | 1407.8 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 250.1 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 35.3 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 120.2 | Bot Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 38.9 | Top Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G23) | 11500 | 1716.2 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 160.5 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 46.6 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 3113.2 | Top Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 175.6 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1039.3 | Top Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 0 | STAGNATED (G16) | 8000 | 158.3 | Bird Y | 0 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 301.5 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 425.8 | Bot Clear | 1666.67 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 72.8 | Bot Clear | 1666.67 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 52.5 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 310.6 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 196.5 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 76.7 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 237.4 | Bot Clear | 1666.67 |
| GA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 40.0 | Bot Clear | 1666.67 |
| Natural ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G16) | 8000 | 857.6 | Pipe DX | 1666.67 |
| Neuro-CMA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 20.6 | Top Clear | 1666.67 |
| CEM | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 49.9 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 75.6 | Bot Clear | 1666.67 |
| PSO | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 42.4 | Bot Clear | 1666.67 |
| Adam-ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G41) | 20500 | 681.8 | Bot Clear | 1666.67 |
| GA | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 27.9 | Bot Clear | 1666.67 |
| Adaptive ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1275.6 | Top Clear | 1666.67 |
| Adam-ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 64.9 | Bot Clear | 1666.67 |
| Diff. Evol. | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 143.5 | Bot Clear | 1666.67 |
| Adaptive ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 604.5 | Bot Clear | 1666.67 |
| Neuro-CMA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 61.5 | Bot Clear | 1666.67 |
| Natural ES | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 50.6 | Bot Clear | 1666.67 |
| PSO | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 24.5 | Top Clear | 1666.67 |
| GA | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 113.1 | Bot Clear | 1666.67 |
| CEM | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 714.7 | Bot Clear | 1666.67 |
| Adaptive ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 130.3 | Bot Clear | 1666.67 |
| Natural ES | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G19) | 9500 | 1013.6 | Top Clear | 1666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 0 | STAGNATED (G31) | 1860 | 462.6 | Bot Clear | 0 |
| Diff. Evol. | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 26.4 | Bot Clear | 1666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 0 | STAGNATED (G49) | 2940 | 911.3 | Vel Vy | 0 |
| PSO | Hard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 109.0 | Bot Clear | 1666.67 |
| Adam-ES | Standard | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 603.6 | Bot Clear | 1666.67 |
| Neuro-CMA | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 69.3 | Top Clear | 1666.67 |
| CEM | Easy | 5→1 | 0 | 0n | 5w | 6p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 64.7 | Bot Clear | 1666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 161.7 | Top Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 225.0 | Top Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 47.0 | Pipe DX | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 375.2 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 26.9 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 0 | STAGNATED (G18) | 1080 | 53.4 | Pipe DX | 0 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 0 | STAGNATED (G28) | 1680 | 736.8 | Bird Y | 0 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 24.5 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 590.6 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 46.6 | Pipe DX | 0 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 199.6 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G32) | 1920 | 2123.0 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 163.4 | Bot Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 84.8 | Top Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 169.6 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 25.5 | Top Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 771.6 | Bot Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 0 | STAGNATED (G30) | 1800 | 461.2 | Bird Y | 0 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 61.4 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 122.1 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 44.6 | Bot Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G20) | 1200 | 2518.0 | Vel Vy | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 44.8 | Top Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 46.1 | Bot Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.15 | 10000 | Perfect (G26) | 1560 | 3078.7 | Bot Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 104.3 | Bot Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 33.6 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 20.7 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 109.5 | Top Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 297.7 | Top Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 106.5 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G23) | 1380 | 426.9 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 102.0 | Top Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 24.8 | Top Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 212.4 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 375.0 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 50.7 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 299.2 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 171.2 | Top Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 36.2 | Pipe DX | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 269.3 | Bot Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 580.4 | Top Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 1 | STAGNATED (G27) | 1620 | 368.8 | Bot Clear | 0.07 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 4048 | STAGNATED (G30) | 1800 | 982.3 | Bot Clear | 269.87 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 28.6 | Bot Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 220.5 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 186.9 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 482.3 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 0 | STAGNATED (G16) | 960 | 193.1 | Pipe DX | 0 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 102.4 | Top Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.30 | 10000 | Perfect (G28) | 1680 | 2204.5 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 20.5 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 67.9 | Top Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 20.3 | Bot Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 48.9 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 249.6 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 122.3 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 33.5 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 232.7 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 31.5 | Top Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 45.3 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G30) | 1800 | 3096.1 | Bot Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 669.5 | Top Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 259.2 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 155.1 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 16.8 | Top Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 63.4 | Bot Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 21.0 | Top Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 188.5 | Top Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 21.8 | Top Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 95.0 | Top Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 841.2 | Top Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 117.7 | Vel Vy | 0 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 305.7 | Top Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 81.7 | Top Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 528.9 | Bot Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1377.9 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 995.6 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 99.8 | Top Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 675.2 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 64.7 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 140.0 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 697.0 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 511.2 | Vel Vy | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 111.7 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 117.9 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 3696.3 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 2092.2 | Top Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 376.5 | Pipe DX | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 149.9 | Top Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 128.9 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 874.6 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 135.5 | Top Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G34) | 5100 | 2126.7 | Bot Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 116.3 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 1223.7 | Top Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 376.7 | Top Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 93.8 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 349.5 | Top Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 48.7 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G29) | 4350 | 1581.2 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.15 | 10000 | Perfect (G52) | 7800 | 9472.8 | Bot Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 27.3 | Top Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 77.9 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 69.7 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 198.8 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 95.9 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 41.4 | Bot Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 82.0 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 134.4 | Bot Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 396.8 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G25) | 3750 | 2443.6 | Bot Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 105.7 | Top Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 56.1 | Top Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 61 | STAGNATED (G21) | 3150 | 399.1 | Bot Clear | 4.07 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 26.5 | Bot Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 617.7 | Top Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 314.7 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 192.9 | Top Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 133.8 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 56.3 | Top Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 40.8 | Bot Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 81.8 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 97.3 | Bot Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 367.0 | Top Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 141.1 | Top Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 79.6 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G22) | 3300 | 1066.7 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 155.7 | Top Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 0 | STAGNATED (G22) | 3300 | 162.6 | Bot Clear | 0 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 22.0 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 66.5 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 400.8 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 373.9 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 796.6 | Top Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1483.1 | Top Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 237.4 | Top Clear | 0 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 19.1 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 110.2 | Bot Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 486.4 | Bot Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 77.8 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 18.4 | Bot Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 3147.9 | Bot Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 218.9 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 236.8 | Top Clear | 0 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 110.8 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 259.2 | Top Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 230.8 | Top Clear | 0 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 35.6 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 0 | STAGNATED (G20) | 6000 | 1487.9 | Pipe DX | 0 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 582.5 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 450.8 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 249.0 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 49.3 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 186.3 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 368.1 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 276.1 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 236.7 | Top Clear | 0 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 733.5 | Bot Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 284.6 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1071.7 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 528.9 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 4075.2 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 432.7 | Top Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 424.3 | Top Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 256.9 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1840.1 | Bot Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 61.9 | Top Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 155.3 | Top Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 468.2 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.15 | 10000 | Perfect (G17) | 5100 | 7202.6 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 34.7 | Bot Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 44.1 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 908.0 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 268.9 | Top Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 488.4 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1779.9 | Top Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 63.6 | Top Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 43.7 | Pipe DX | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 694.0 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 299.3 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 131.7 | Top Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 1665.2 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 106.6 | Bot Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 356.4 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1035.1 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 150.8 | Bot Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 338 | STAGNATED (G20) | 6000 | 1488.6 | Top Clear | 22.53 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 596.6 | Top Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 62.6 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 75.5 | Bot Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 881.9 | Top Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 33.2 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 712.5 | Top Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 369.9 | Top Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 257.0 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 187.3 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 255.4 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2290.5 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 57.1 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 609.4 | Bird Y | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 192.0 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1064.4 | Bot Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 114.7 | Bot Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 112.1 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 261.8 | Top Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 44.2 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 95.7 | Top Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G16) | 4800 | 1793.3 | Top Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 325.5 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 40.5 | Bot Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 59.8 | Bot Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 6026.6 | Top Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 186.3 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1721.7 | Top Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 1182.6 | Bot Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 3109.0 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 278.1 | Bot Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 287.4 | Top Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 0 | STAGNATED (G18) | 9000 | 438.9 | Bird Y | 0 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 0 | STAGNATED (G32) | 16000 | 763.5 | Top Clear | 0 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 269.9 | Top Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 94.9 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1368.7 | Bot Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 394.7 | Top Clear | 0 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 393.2 | Top Clear | 0 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 386.8 | Bot Clear | 0 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 627.8 | Bot Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 121.6 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 94.5 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 890.4 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 82.2 | Top Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 199.0 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G28) | 14000 | 8458.8 | Bot Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 144.9 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 5082.5 | Top Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 9175.9 | Top Clear | 666.67 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 89.1 | Bot Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 236.6 | Top Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 90.1 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 452.7 | Top Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 955.3 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 0 | STAGNATED (G16) | 8000 | 391.9 | Pipe DX | 0 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 916.7 | Top Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 1188.1 | Top Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 46.7 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 157.4 | Bot Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 94.9 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 73.5 | Bot Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 590.6 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 0 | STAGNATED (G17) | 8500 | 418.0 | Top Clear | 0 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 292.4 | Bot Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 704.9 | Bot Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 830.5 | Top Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 75.8 | Top Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 674.4 | Top Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 270.4 | Top Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 226.1 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 130.0 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 1672.6 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 332.7 | Top Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 97.9 | Bot Clear | 666.67 |
| Adam-ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 31 | STAGNATED (G21) | 10500 | 3253.4 | Top Clear | 2.07 |
| GA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 101.4 | Bot Clear | 666.67 |
| Natural ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 44.6 | Bot Clear | 666.67 |
| CEM | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 170.7 | Bot Clear | 666.67 |
| Adaptive ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 562.9 | Bot Clear | 666.67 |
| Diff. Evol. | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 157.6 | Bot Clear | 666.67 |
| PSO | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 97.4 | Bot Clear | 666.67 |
| Natural ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 371.6 | Bot Clear | 666.67 |
| GA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 364.9 | Top Clear | 666.67 |
| Adaptive ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 217.6 | Top Clear | 666.67 |
| Diff. Evol. | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 103.9 | Bot Clear | 666.67 |
| Neuro-CMA | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 723.9 | Top Clear | 666.67 |
| PSO | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 242.7 | Top Clear | 666.67 |
| Neuro-CMA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1150.6 | Bot Clear | 666.67 |
| CEM | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 446.1 | Top Clear | 666.67 |
| Natural ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G14) | 7000 | 400.3 | Bot Clear | 666.67 |
| Adam-ES | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 531.0 | Bot Clear | 666.67 |
| Diff. Evol. | Standard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 171.7 | Bot Clear | 666.67 |
| CEM | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 221.0 | Bot Clear | 666.67 |
| Adam-ES | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 115.5 | Top Clear | 666.67 |
| Adaptive ES | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1811.1 | Bot Clear | 666.67 |
| Neuro-CMA | Easy | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 36.4 | Top Clear | 666.67 |
| PSO | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 316.4 | Top Clear | 666.67 |
| GA | Hard | 5→2→1 | 1 | 2n | 12w | 15p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 447.4 | Top Clear | 666.67 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 62.3 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 142.6 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1258.6 | Top Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G22) | 1320 | 4490.0 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 74.3 | Bird Y | 0 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 61.5 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 2365.9 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 527.1 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 45.1 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 1128.4 | Top Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 250.1 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G39) | 2340 | 12673.9 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 468.6 | Top Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 815.7 | Top Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 278.5 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 428.6 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 77.9 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 49.2 | Vel Vy | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G25) | 1500 | 3532.7 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 158.1 | Vel Vy | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 70.8 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 365.9 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1489.5 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 3334.9 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 291.4 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 215.6 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 105.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 878.0 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 367.3 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 1257.1 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 76.5 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 75.9 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 42.1 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 1411.6 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 28.4 | Top Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 339.1 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G27) | 1620 | 1681.4 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G39) | 2340 | 7489.8 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 483.0 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 155.4 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 921.1 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 19.2 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G19) | 1140 | 1275.5 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1986.5 | Top Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 192.5 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 190.4 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 336.3 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 511.7 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 93.5 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 357.5 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 24.5 | Top Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 754.1 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 11 | STAGNATED (G24) | 1440 | 585.0 | Bot Clear | 0.38 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G28) | 1680 | 1348.8 | Top Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 134.8 | Top Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 151.4 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 123.0 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 45.5 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 35.8 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 85.2 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 106.4 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 407.4 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G28) | 1680 | 7394.3 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 146.1 | Pipe DX | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 1996.4 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 414.4 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 62.8 | Top Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 50.4 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 57.5 | Top Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 219.1 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 32.5 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 500.6 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 3668.6 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 162.4 | Top Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 0 | STAGNATED (G17) | 2550 | 239.2 | Top Clear | 0 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 754.7 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 229.5 | Top Clear | 0 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1966.9 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2120.5 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 912.7 | Top Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 799.5 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1316.2 | Top Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1670.7 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 110.3 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G21) | 3150 | 1653.0 | Top Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1460.6 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 428.9 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 1297.9 | Bot Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 50.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 856.3 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1363.2 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 79.6 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G19) | 2850 | 4111.5 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 139.1 | Top Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 806.5 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 571.6 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 163.6 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 285.9 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 518.0 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 117.6 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 2287.7 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 93.1 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 163.3 | Top Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 105.3 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 262.9 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 274.5 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 811.1 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 185.4 | Top Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 1847.8 | Top Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 76.1 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 398.1 | Top Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G13) | 1950 | 1458.5 | Top Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1107.3 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 270.4 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 290.4 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 117.7 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 195.3 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 635.8 | Top Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 177.9 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1172.3 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 102.6 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 475.8 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 443.9 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 82.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 44.8 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 604.3 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 419.8 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 486.4 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 163.7 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 752.3 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 103.8 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 85.0 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 314.6 | Top Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 181.9 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 219.5 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 146.7 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 447.8 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 847.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 2345 | STAGNATED (G23) | 3450 | 3052.1 | Top Clear | 80.86 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 101 | STAGNATED (G20) | 3000 | 2429.7 | Bot Clear | 3.48 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 457.8 | Vel Vy | 0 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 152.1 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 128.4 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1098.2 | Bird Y | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 74.4 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 208.4 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 144.0 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 458.7 | Pipe DX | 0 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 225.2 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1451.8 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 0 | STAGNATED (G32) | 9600 | 6945.4 | Pipe DX | 0 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 4707.0 | Top Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 75.6 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1417.4 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 129.7 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 181.2 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G20) | 6000 | 3557.5 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1881.4 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 3330.2 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2459.8 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 5247.4 | Bot Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 3343.0 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 1933.6 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 3732.3 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 310.9 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 5427.8 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 24 | STAGNATED (G17) | 5100 | 3049.3 | Bot Clear | 0.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 870.3 | Top Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 97.0 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 8067.4 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 658.0 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 544.2 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 1554.0 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 2773.3 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 374.7 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 601.5 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 777.7 | Top Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 208.4 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1042.4 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 92.0 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2336.4 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G18) | 5400 | 3610.5 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 383.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 126.2 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 659.6 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 885.0 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 570.5 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 289.7 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 172.7 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1523.3 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 521.3 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 640.4 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 1267.4 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1274.3 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 107.6 | Top Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G16) | 4800 | 1916.8 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 260.2 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 1331.1 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 181.5 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 45.2 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 202.6 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G19) | 5700 | 1397.5 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 2479.5 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 888.9 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 95.6 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1638.1 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 445.3 | Top Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 508.7 | Top Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 81.4 | Bird Y | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 292.5 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 611.1 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 305.2 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 682.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 7173.4 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 158.6 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2910.3 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1048.9 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 5453.9 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 186.6 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 764.2 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 0 | STAGNATED (G19) | 9500 | 5737.6 | Bird Y | 0 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 1426.8 | Top Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 172.9 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 2243.0 | Top Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2166.1 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 367.4 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 761.0 | Pipe DX | 0 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1778.7 | Pipe DX | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 765.6 | Top Clear | 0 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 140.2 | Top Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 629.7 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1552.1 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 3946.0 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 134.5 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 2194.7 | Bot Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1892.5 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 2065.6 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 22951.2 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 455.9 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 421.7 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G27) | 13500 | 10542.0 | Top Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 264.8 | Bot Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 344.7 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 807.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 199.5 | Bot Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1034.6 | Top Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1099.0 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 7542.7 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 514.0 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 6409.3 | Vel Vy | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 2058.7 | Bird Y | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 391.7 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 186.9 | Bot Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 2566.5 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 222.4 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 5892.0 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 904.9 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 8230.1 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 654.5 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 495.1 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 740.4 | Bot Clear | 344.83 |
| GA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 137.9 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 613.4 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1073.5 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1500.9 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 644.1 | Bot Clear | 344.83 |
| PSO | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 162.6 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 2460.9 | Top Clear | 344.83 |
| CEM | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 363.9 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 360.2 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 291.5 | Top Clear | 344.83 |
| GA | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 122.6 | Top Clear | 344.83 |
| Natural ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 445.7 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 292.9 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 184.7 | Bot Clear | 344.83 |
| PSO | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 344.5 | Bot Clear | 344.83 |
| GA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 676.0 | Top Clear | 344.83 |
| CEM | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 1634.2 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2645.7 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 146.3 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 779.7 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2064.3 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 176.8 | Pipe DX | 0 |
| Neuro-CMA | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 2530.3 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 505.2 | Top Clear | 344.83 |
| CEM | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 139.5 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 519.0 | Bot Clear | 344.83 |
| PSO | Hard | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 765.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→4→1 | 1 | 4n | 24w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 161.4 | Bot Clear | 344.83 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 203.9 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 0 | STAGNATED (G28) | 1680 | 1915.9 | Bot Clear | 0 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 177.5 | Vel Vy | 0 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 147.7 | Pipe DX | 0 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 300.6 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1419.6 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 71.7 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1335.0 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 518.2 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 74.2 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 106.7 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 961.5 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 0 | STAGNATED (G18) | 1080 | 199.4 | Bot Clear | 0 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 636.9 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 4478.1 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 217.6 | Top Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 820.4 | Top Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 279.0 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 100.9 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 1 | STAGNATED (G24) | 1440 | 1642.6 | Bot Clear | 0.02 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 202.9 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 218.7 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G17) | 1020 | 3444.0 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 143.0 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 3958.4 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 451.8 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 32 | STAGNATED (G20) | 1200 | 1664.3 | Bot Clear | 0.56 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 1260.3 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 47.1 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 273.9 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 628.1 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G27) | 1620 | 1765.9 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1137.6 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 2017.4 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 2880.5 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 0 | STAGNATED (G22) | 1320 | 1300.1 | Bird Y | 0 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 509.2 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 1816.0 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 3679.4 | Top Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 39.0 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 471.3 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 530.4 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 481.4 | Pipe DX | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 168.6 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 847.8 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1411.0 | Top Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 145.7 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 153.4 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 433.7 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 252.3 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 73.1 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 121.7 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 0 | STAGNATED (G25) | 1500 | 1345.5 | Vel Vy | 0 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 831.7 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 52.8 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 64.3 | Top Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 525.2 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 474.8 | Pipe DX | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 1 | STAGNATED (G16) | 960 | 205.7 | Vel Vy | 0.02 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 903.7 | Pipe DX | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 108.6 | Top Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1666.7 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 414.0 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1020.9 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 169.4 | Top Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 366.9 | Pipe DX | 0 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 1863.8 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 842.4 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 88.9 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 202 | STAGNATED (G21) | 3150 | 5946.9 | Bot Clear | 3.54 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1286.0 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 229.9 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 59.8 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 107.2 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 1122.7 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 1244.1 | Top Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 6809.0 | Top Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 126.6 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 1674.2 | Top Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 2570.0 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 281.2 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G20) | 3000 | 4040.9 | Bot Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 908.6 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 470.8 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 194.3 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 115.8 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 328.3 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1297.7 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 516.0 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 464.0 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 677.7 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 80.3 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 193.9 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 2162.2 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 676.4 | Top Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 3200.6 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G34) | 5100 | 6708.2 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 169.7 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 3109.2 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 507.7 | Top Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 1 | STAGNATED (G18) | 2700 | 2408.0 | Top Clear | 0.02 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1281.7 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 68.5 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 103.0 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 723.1 | Bot Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 2123.3 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 464.5 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 89.1 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1152.5 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 215.2 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1046.8 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 474.1 | Top Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 632.1 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 483.4 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1412.2 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 542.0 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 82.9 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 147.7 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 1690.1 | Top Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 170.5 | Top Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 656.5 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 2930.5 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 844.6 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 2038.5 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 838.9 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1282.0 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1523.2 | Top Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 134.6 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 165.2 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 219.3 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 368.7 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 597.2 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 1070.5 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 616.5 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1439.1 | Top Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 354.7 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 877.3 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 224.3 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 293.6 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 617.5 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 329.4 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 205.1 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 3699.6 | Top Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 1899.5 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1114.9 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 403.6 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2653.3 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 187.6 | Top Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 3011.0 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1584.4 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2221.4 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 985.4 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 281.0 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 965.0 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 1571.3 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 230.5 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 2494.7 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1818.1 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1938.8 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 11347.6 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G31) | 9300 | 50385.8 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 417.0 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 2769.9 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G18) | 5400 | 12257.5 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 274.0 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3516.2 | Top Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 256.7 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1653.8 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 309.8 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1802.4 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 365.4 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 3926.6 | Top Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 895.5 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 211.9 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 626.1 | Top Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1239.8 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1287.5 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 621.2 | Top Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 478.1 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 2088.9 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 316.3 | Top Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1444.9 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 479.6 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1292.9 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 148.1 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 136.0 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1691.0 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 2902.1 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 4312.5 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 357.8 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 805.9 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1441.1 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 126.0 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 540.4 | Top Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 4192.8 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 2265.9 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 403.5 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 432.9 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 906.6 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 491.9 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G23) | 6900 | 5271.7 | Top Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1142.4 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 426.6 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 2604.8 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 334.1 | Pipe DX | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 157.9 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 3309.5 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 708.1 | Top Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2788.4 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 3935.7 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 3138.8 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 563.8 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 112.8 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 633.6 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 458.3 | Top Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 513.5 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 2378.2 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 410.0 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1795.3 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1483.5 | Bird Y | 0 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 304.7 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 9934.0 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 339.8 | Bot Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 224.2 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 2713.8 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 5382.7 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1500.9 | Top Clear | 0 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G15) | 7500 | 9533.5 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G21) | 10500 | 10779.3 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 137.0 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 209.2 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 7846.3 | Top Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1121.0 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 356.8 | Bot Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 782.7 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 711.9 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 4080.2 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 870.2 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G10) | 5000 | 17616.1 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 293.8 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1397.6 | Bot Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 223.8 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 960.1 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 6132.8 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1210.5 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1672.1 | Top Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 571.8 | Top Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2375.0 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 179.3 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1540.2 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 339.3 | Top Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G15) | 7500 | 8383.8 | Top Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 845.7 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 282.6 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 4944.9 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 1438.9 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 722.0 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 217.5 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 2285.8 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1920.6 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 308.5 | Bot Clear | 175.44 |
| GA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 352.2 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 4268.0 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 179.3 | Top Clear | 175.44 |
| CEM | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 393.3 | Top Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2697.1 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1285.8 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 155.0 | Bot Clear | 175.44 |
| PSO | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 652.7 | Bot Clear | 175.44 |
| GA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1763.3 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 4546.1 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 7767.5 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 374.6 | Bot Clear | 175.44 |
| PSO | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 935.1 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 492.8 | Bot Clear | 175.44 |
| CEM | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 277.8 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 918.0 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 345.5 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G25) | 12500 | 11102.5 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 278.9 | Top Clear | 175.44 |
| GA | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 5421.4 | Top Clear | 175.44 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 351.9 | Bird Y | 0 |
| Natural ES | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 427.5 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 332.9 | Bot Clear | 175.44 |
| PSO | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 603.9 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1674.9 | Bot Clear | 175.44 |
| CEM | Easy | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 193.5 | Vel Vy | 175.44 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 93.3 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→8→1 | 1 | 8n | 48w | 57p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 8928.7 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 371.6 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 156.5 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G42) | 2520 | 7716.1 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 203.8 | Top Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 350.0 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 786.1 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 703.3 | Top Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1157.0 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 458.0 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 209.4 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 7171.5 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 202.4 | Top Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 2178.0 | Top Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 324.6 | Top Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 1021.6 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G25) | 1500 | 10482.3 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G16) | 960 | 17901.6 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 1035.0 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 349.8 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 4162.4 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 181.4 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 142.2 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 11460.7 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 398.7 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 1803.9 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1258.0 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 192.9 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G23) | 1380 | 4323.0 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 507.0 | Top Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 1432.2 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 641.9 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1030.9 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 390.8 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 1641.9 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 1960.6 | Bird Y | 0 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 833.9 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 1928.8 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 1269.2 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 1762.9 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 2573.8 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 2223.3 | Top Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 1140.6 | Top Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 385.2 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 192 | STAGNATED (G20) | 1200 | 2763.1 | Bot Clear | 1.7 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 3521.2 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 157.4 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 237.4 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 98.0 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 6342.4 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 6479.6 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 609.4 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 153.3 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 1574.8 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1124.1 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 718.4 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 527.9 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 184.9 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 2946.9 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 176.0 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 862.6 | Top Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 919.4 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 1872.9 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1863.5 | Top Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 159.8 | Bot Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 730 | STAGNATED (G34) | 2040 | 19890.5 | Top Clear | 6.46 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 714.1 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 7746.2 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 806.5 | Top Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 415.7 | Top Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 4722.5 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 935.5 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1459.1 | Top Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 3092.2 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1514.6 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G24) | 3600 | 35306.1 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 610.2 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 2723.2 | Top Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 498.1 | Top Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 5643.5 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 386.4 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 662.8 | Top Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 5446.3 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 846.4 | Pipe DX | 0 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 283.9 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 6506.2 | Top Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1855.7 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 702.6 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1125.3 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1245.3 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 8126.3 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 132.6 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 282.4 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 187.6 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 0 | STAGNATED (G21) | 3150 | 7690.2 | Bot Clear | 0 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 2118.5 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1327.7 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 167.6 | Top Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 810.0 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 2013.4 | Top Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 426.9 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 1926.0 | Top Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G17) | 2550 | 5524.8 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 638.7 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 314.2 | Top Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 6182.7 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 871.7 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1041.3 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 4363.2 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 3865.3 | Top Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 4556.7 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 6707.8 | Top Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2758.5 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 2544.3 | Top Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 153.9 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 377.0 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 4482.5 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 331.8 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 7699.3 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1903.3 | Top Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 7955.8 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 2031.3 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1038.8 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G21) | 3150 | 6798.5 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 2018.4 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 130.2 | Top Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1927.0 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1323.5 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 397.8 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G22) | 3300 | 5524.5 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 236.2 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1664.7 | Pipe DX | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 709.2 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 4722.3 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 290.8 | Top Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 6832.2 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 3036.4 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 2801.7 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 201.1 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 456.2 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 291.2 | Top Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1426.4 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 799.9 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 2992.1 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1557.2 | Top Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 3683.2 | Bird Y | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 2267.5 | Top Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 6915.2 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 337.1 | Top Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3427.0 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2322.2 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 7706.0 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 3121.0 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2807.9 | Top Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2125.1 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1057.4 | Bot Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 6913.3 | Bird Y | 0 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1556.0 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G25) | 7500 | 38033.5 | Top Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 324.0 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 8891.3 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 657.1 | Top Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 964.0 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 19779.7 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 10136.2 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1248.7 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 204.0 | Top Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1412.3 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 422.8 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 366.8 | Top Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1654.4 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 225.1 | Top Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 378.1 | Bot Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G25) | 7500 | 25668.4 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 2615.8 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 535.6 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 17091.6 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 563.0 | Bot Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1444.4 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G16) | 4800 | 10847.4 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 9594.5 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 476.7 | Top Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 6964.0 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 867.0 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 4664.2 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3930.2 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1024.3 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 315.8 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 5245.6 | Top Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 4335.4 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 248.8 | Top Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 924.1 | Bot Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 3443.9 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 4280.3 | Top Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 788.4 | Top Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 900.0 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 282.1 | Top Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 5494.7 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 915.5 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 2599.6 | Top Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 307.7 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 813.4 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1348.2 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 336.4 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 8654.7 | Pipe DX | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 4573.0 | Bot Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 8410.5 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 4268.6 | Top Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 320.2 | Top Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 5045.9 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 370.4 | Top Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 642.6 | Bot Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 0 | STAGNATED (G35) | 17500 | 38220.0 | Bot Clear | 0 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 410.9 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1424.7 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 7658.9 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1066.4 | Vel Vy | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2429.0 | Top Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 2343.6 | Top Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3651.3 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 6149.4 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 4344.8 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1604.9 | Bot Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 14206.4 | Top Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 23985.9 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 615.3 | Top Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 9643.4 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1588.7 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1758.8 | Top Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 27172.8 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 4979.1 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 50479.0 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 14063.4 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 992.5 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 1019.1 | Bot Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1260.9 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 356.0 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 1054.2 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 57926.3 | Bot Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 3080.9 | Top Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 3669.2 | Bot Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 53319.4 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 448.5 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2137.3 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 837.4 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2629.4 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 989.3 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 485.3 | Top Clear | 88.5 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 10176.9 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1143.8 | Top Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1355.3 | Top Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 932.4 | Top Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 12871.0 | Top Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 534.1 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 3218.5 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2889.4 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 509.9 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 8422.4 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 18554.8 | Bot Clear | 88.5 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1389.9 | Bot Clear | 88.5 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 549.4 | Top Clear | 88.5 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 6916.9 | Top Clear | 88.5 |
| Natural ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 520.7 | Bot Clear | 88.5 |
| Diff. Evol. | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 350.6 | Bot Clear | 88.5 |
| GA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 684.3 | Bot Clear | 88.5 |
| Adam-ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 761.6 | Bot Clear | 88.5 |
| CEM | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1949.2 | Bot Clear | 88.5 |
| PSO | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 901.3 | Bot Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 15125.9 | Bot Clear | 88.5 |
| Adaptive ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 9753.2 | Bot Clear | 88.5 |
| GA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1042.9 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1332.7 | Bot Clear | 88.5 |
| Adaptive ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1430.0 | Bot Clear | 88.5 |
| Adam-ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 549.2 | Bot Clear | 88.5 |
| Diff. Evol. | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 756.2 | Bot Clear | 88.5 |
| PSO | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1141.4 | Bot Clear | 88.5 |
| CEM | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G13) | 6500 | 9887.9 | Bot Clear | 88.5 |
| Neuro-CMA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1488.8 | Bot Clear | 88.5 |
| Adam-ES | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 366.0 | Bot Clear | 88.5 |
| GA | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 6771.9 | Bot Clear | 88.5 |
| Natural ES | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 997.1 | Top Clear | 88.5 |
| Adaptive ES | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 3045.3 | Bot Clear | 88.5 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 41.4 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 18193.1 | Top Clear | 88.5 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G17) | 1020 | 2849.3 | Bot Clear | 204.08 |
| PSO | Hard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 524.7 | Bot Clear | 88.5 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G35) | 2100 | 2512.9 | Bot Clear | 204.08 |
| CEM | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 589.7 | Top Clear | 88.5 |
| Neuro-CMA | Easy | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 982.2 | Top Clear | 88.5 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 299.6 | Top Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1324.4 | Top Clear | 204.08 |
| Diff. Evol. | Standard | 5→16→1 | 1 | 16n | 96w | 113p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 10069.2 | Bot Clear | 88.5 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 738.0 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 240.2 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 40.4 | Top Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1673.9 | Top Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 1643.4 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G33) | 1980 | 14159.9 | Top Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1444.9 | Bird Y | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 60.1 | Top Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1321.5 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1485.3 | Top Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 1015.5 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 656.8 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 527.8 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 146.5 | Top Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 217.3 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G22) | 1320 | 14883.7 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G23) | 1380 | 2032.7 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 79.6 | Top Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 837.3 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 81.0 | Top Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 112.0 | Top Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 601.7 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 222.7 | Top Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 338.5 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 563.0 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G26) | 1560 | 1748.9 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 106.7 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 3319.1 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 248.7 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 223.8 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 358.2 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 432.0 | Top Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 248.9 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G19) | 1140 | 2945.3 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 432.6 | Top Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1177.3 | Top Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 186.0 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 180.4 | Top Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 73.6 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 1488.3 | Top Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 187.1 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 2342.1 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 402.7 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G25) | 1500 | 14259.9 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 45.0 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 71.7 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 63.0 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 1282.2 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 436.5 | Top Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G51) | 3060 | 3441.4 | Top Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 198.0 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 185.3 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 181.2 | Top Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 145.9 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G28) | 1680 | 1197.2 | Bot Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 196.0 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 316.7 | Top Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 237.5 | Top Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 1340.1 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 40.2 | Top Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 51.5 | Top Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 380.8 | Vel Vy | 0 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 37.4 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 805.2 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 940.1 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 334.7 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 71.0 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 1332.8 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 2121.7 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 1768.3 | Top Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1091.5 | Top Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 236.1 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 4393.9 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 260.5 | Bot Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 0 | STAGNATED (G27) | 4050 | 1766.2 | Bot Clear | 0 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 123.3 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 2735.9 | Top Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G20) | 3000 | 3789.0 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 323.0 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 404.9 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 725.6 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 563.2 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 179.2 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 141.2 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 2650.4 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 2020.8 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 3067.2 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 293.9 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 318 | STAGNATED (G22) | 3300 | 3447.0 | Top Clear | 6.49 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 336.4 | Pipe DX | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 535.6 | Top Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 138.7 | Top Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G20) | 3000 | 4094.4 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 140.1 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 70.4 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 760.6 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 73.2 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 380.1 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 207.5 | Top Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 496.2 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 168.8 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 614.6 | Top Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 10764.7 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 68.3 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 88.0 | Top Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 0 | STAGNATED (G22) | 3300 | 3070.8 | Pipe DX | 0 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G26) | 3900 | 5378.7 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 890.4 | Top Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 842.9 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 120.7 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1385.7 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 1319.1 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 4022.6 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 98.2 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 155.2 | Top Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 2914.8 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 400.6 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 51.3 | Top Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 2644.0 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 1777.8 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 2014.6 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 585.5 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 215.8 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 858.0 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 86.3 | Bot Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 546.1 | Top Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 126.8 | Vel Vy | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 82.7 | Top Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1154.3 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1383.0 | Top Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 167.9 | Top Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 1875.1 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 82.8 | Top Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 802.4 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 3016.9 | Top Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 635.0 | Vel Vy | 0 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 437.9 | Bird Y | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 2258.4 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 506.2 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 364.6 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 386.6 | Top Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1141.6 | Pipe DX | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 606.5 | Top Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G38) | 11400 | 19721.4 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 753.1 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 336.0 | Vel Vy | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 3832.0 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 4770.8 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 3153.4 | Top Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 414.6 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 451.7 | Bot Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1752.8 | Top Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 4724 | STAGNATED (G24) | 7200 | 8172.7 | Bot Clear | 96.41 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 0 | STAGNATED (G32) | 9600 | 6537.7 | Pipe DX | 0 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1410.9 | Top Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1276.1 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 3344.6 | Bird Y | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 579.6 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 0 | STAGNATED (G16) | 4800 | 776.8 | Bird Y | 0 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 271.0 | Top Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 441.1 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 111.0 | Top Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1845.3 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 3738.6 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 140.0 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1886.8 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 911.0 | Top Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1251.5 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 376.5 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 9415.2 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 460.4 | Bot Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 405.0 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1275.8 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2106.3 | Top Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1248.1 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 347.2 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1804.5 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 724.4 | Top Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 972.0 | Top Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 269.6 | Top Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 116.5 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 3182.9 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 306.9 | Top Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G13) | 3900 | 3301.9 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G19) | 5700 | 2214.4 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 153.7 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 1597.7 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 286.7 | Top Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 485.4 | Pipe DX | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.30 | 10000 | Perfect (G17) | 5100 | 13508.9 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 90.8 | Pipe DX | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1890.3 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 111.6 | Top Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 2907.3 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 140.6 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 226.1 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1192.5 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 415.8 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 421.9 | Pipe DX | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 3907.4 | Bot Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 208.5 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 126.3 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1798.7 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 177.2 | Top Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 971.6 | Top Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 488.3 | Top Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 497.7 | Top Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 215.7 | Top Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 147.1 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 282.6 | Top Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1701.1 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 2015.9 | Bot Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 4448.1 | Top Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 6354.6 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2698.1 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 10392.4 | Top Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 772.5 | Top Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1930.5 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 287.7 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 191.0 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G26) | 13000 | 15329.3 | Bot Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 3616.9 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1289.8 | Pipe DX | 0 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 227.7 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 15299.5 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1484.9 | Bot Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 8867.5 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1706.3 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 4097.5 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 351.3 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 213.8 | Bot Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1240.9 | Top Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 10987.0 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1650.2 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 567.8 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 693.9 | Bot Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 715.2 | Top Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 585.3 | Top Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 458.9 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1545.0 | Top Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 259.5 | Bird Y | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 13 | STAGNATED (G28) | 14000 | 9167.4 | Top Clear | 0.27 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G35) | 17500 | 18743.3 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.15 | 10000 | Perfect (G18) | 9000 | 38301.3 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 187.7 | Bot Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1274.4 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 209.5 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1481.1 | Top Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 900.8 | Bot Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 5031.2 | Bot Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 336.3 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 4737.4 | Top Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 202.9 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 2721.8 | Bot Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 506.7 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2416.9 | Bot Clear | 204.08 |
| GA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 251.5 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 5537.5 | Top Clear | 204.08 |
| Adam-ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 3338.0 | Bot Clear | 204.08 |
| Natural ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 209.4 | Bot Clear | 204.08 |
| Adaptive ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 258.7 | Top Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 5976.4 | Top Clear | 204.08 |
| CEM | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1307.4 | Bot Clear | 204.08 |
| PSO | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 238.2 | Bot Clear | 204.08 |
| Neuro-CMA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 156.5 | Bot Clear | 204.08 |
| Natural ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 2338.8 | Top Clear | 204.08 |
| Adam-ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 262.0 | Bot Clear | 204.08 |
| GA | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 227.9 | Bot Clear | 204.08 |
| Diff. Evol. | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1642.2 | Top Clear | 204.08 |
| CEM | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1288.3 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 4535.6 | Top Clear | 204.08 |
| Adaptive ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 237.6 | Top Clear | 204.08 |
| Diff. Evol. | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 227.7 | Bot Clear | 204.08 |
| Neuro-CMA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 752.1 | Bot Clear | 204.08 |
| Adam-ES | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1169.4 | Bot Clear | 204.08 |
| GA | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 340.6 | Top Clear | 204.08 |
| CEM | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 280.8 | Bot Clear | 204.08 |
| Diff. Evol. | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 175.7 | Top Clear | 204.08 |
| Natural ES | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 727.4 | Top Clear | 204.08 |
| PSO | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1510.4 | Bot Clear | 204.08 |
| Adaptive ES | Hard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 4694.5 | Bot Clear | 204.08 |
| PSO | Standard | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 5798.8 | Bot Clear | 204.08 |
| Neuro-CMA | Easy | 5→4→4→1 | 2 | 8n | 40w | 49p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 173.5 | Vel Vy | 204.08 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1051.5 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1243.2 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 0 | STAGNATED (G22) | 1320 | 2178.2 | Bot Clear | 0 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1469.5 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 146.2 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 0 | STAGNATED (G19) | 1140 | 4273.2 | Bot Clear | 0 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1883.3 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 158.5 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 2519.1 | Vel Vy | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 168.1 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G60) | 3600 | 7814.2 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 5811.5 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 477.4 | Vel Vy | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1081.5 | Top Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 2360.5 | Top Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 460.0 | Bot Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G30) | 1800 | 4984.2 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1221.9 | Bot Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 5918.1 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 632.5 | Pipe DX | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 62.8 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 135.2 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 126.0 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 69.6 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 684.8 | Top Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 130.7 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 621.3 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 245.4 | Top Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 3251.8 | Bot Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 3227.4 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 1193.1 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 115.7 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 2316.2 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 1263.9 | Top Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 6899.8 | Bot Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G21) | 1260 | 3218.2 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 301.8 | Top Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 2287.7 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G19) | 1140 | 2051.3 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 176.0 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 66.6 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 5437.8 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 182.2 | Bot Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 2304.8 | Top Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 563.5 | Top Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1959.9 | Top Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 2282.5 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 1 | STAGNATED (G30) | 1800 | 1545.4 | Bot Clear | 0.01 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 110.3 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 840.4 | Top Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1001.3 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G32) | 1920 | 3089.1 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1361.6 | Bot Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 1438.8 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 136.2 | Bot Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 557.5 | Top Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 987.7 | Bot Clear | 0 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 5856.1 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 3262.1 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 2061.4 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 6843.7 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 306.3 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 1662.6 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 173.4 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 294.8 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 607.9 | Pipe DX | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 65 | STAGNATED (G24) | 1440 | 8563.7 | Bot Clear | 0.73 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 698.6 | Top Clear | 0 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 3903.6 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 462.2 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 345.0 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 2247.7 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 458.8 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 4670.8 | Top Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 3234.1 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1306.5 | Top Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 390.3 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 622.2 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 5673.8 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1668.3 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 163.4 | Top Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1991.0 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 2729.4 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 134.0 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 3543.0 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1581.5 | Bot Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 632.2 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1386.9 | Top Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 508.1 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 6591.5 | Top Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 418.6 | Bot Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1009.4 | Top Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1866.6 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 11288.6 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 321.5 | Top Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1112.3 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 174.9 | Top Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 2644.3 | Top Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1163.8 | Top Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G13) | 1950 | 3415.4 | Top Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 5449.9 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 808.6 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G31) | 4650 | 8913.9 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 514.5 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1497.7 | Vel Vy | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 1809.0 | Top Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 125.2 | Top Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 60 | 0.50 | 2328 | STAGNATED (G17) | 1020 | 6228.5 | Bot Clear | 26.16 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1950.8 | Top Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 4356.0 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 2616.8 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1056.4 | Top Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 274.9 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 4807.5 | Top Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 6563.2 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 9772.8 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 178.2 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 168.5 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 548.6 | Top Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 150.0 | Bot Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 336 | STAGNATED (G18) | 2700 | 42460.4 | Top Clear | 3.78 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 1964.5 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 481.5 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 254.8 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 710.5 | Top Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 410.5 | Top Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 2734.2 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 156.8 | Vel Vy | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 4049.3 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 251.2 | Top Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 129.6 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 3248.6 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G19) | 2850 | 9654.4 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 2342.0 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1724.1 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 1813.9 | Vel Vy | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1685.8 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1560.3 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.30 | 10000 | Perfect (G17) | 2550 | 7330.8 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 29 | STAGNATED (G22) | 3300 | 5810.1 | Bot Clear | 0.33 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 1153.4 | Bot Clear | 0 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1087.3 | Pipe DX | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 390.5 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 5268.7 | Top Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2600.2 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 8833.5 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 284.0 | Bot Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 322.5 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1317.6 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 373.0 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1814.1 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 665.9 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 5331.1 | Bot Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G32) | 9600 | 18455.3 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1407.7 | Pipe DX | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G17) | 5100 | 8736.0 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 691.4 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1649.5 | Vel Vy | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1818.3 | Pipe DX | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2560.5 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 8419.5 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 267.8 | Bot Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 841.2 | Pipe DX | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 3644.7 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 172.0 | Bot Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 202.0 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 270.9 | Top Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 336.8 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 277.8 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 271.8 | Top Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G19) | 5700 | 8826.8 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1833.9 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 261.7 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 4808.6 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 4110.1 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 259.4 | Bot Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 3270.9 | Top Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 267.0 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 27082.8 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 10514.7 | Top Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2464.8 | Top Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1239.6 | Top Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 188.7 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 570.2 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G19) | 5700 | 9569.2 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 2007.9 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1464.5 | Top Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 175.1 | Pipe DX | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 874.7 | Pipe DX | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 380.2 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1247.1 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1960.1 | Top Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 7989.2 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1312.3 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1251.5 | Top Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 6460.3 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G21) | 6300 | 6560.1 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G24) | 7200 | 6208.7 | Top Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1381.0 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1248.8 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 2783.3 | Top Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 2797.9 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 679.9 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 945.6 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 480.4 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 321.8 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 6218.0 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 3967.9 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 354.2 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 243.1 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 1936.7 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G12) | 3600 | 3562.3 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G17) | 5100 | 26986.7 | Top Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1128.5 | Top Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 802.4 | Top Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 3426.1 | Top Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 498.6 | Top Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 5074.6 | Bot Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 684.9 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2025.1 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G14) | 7000 | 10633.6 | Top Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 6663.9 | Top Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 396.0 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 28285.6 | Top Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 4937.4 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 4186.9 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3030.4 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 13110.4 | Top Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 435.0 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 2200.7 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1024.9 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 5786.0 | Bot Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 119295.6 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 5270.7 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 10412.6 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 684.6 | Bot Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 328.3 | Bot Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 742.4 | Top Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 5083.5 | Bot Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 47644.3 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1832.1 | Bot Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 684.3 | Vel Vy | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 4040.6 | Top Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 11059.9 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 822.8 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 617.9 | Bot Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 9040.1 | Bot Clear | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 2841.6 | Bot Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 2785.3 | Top Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 3550.5 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 4211.5 | Top Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 557.9 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 665.2 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 398.8 | Top Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1069.2 | Top Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1646.6 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 360.5 | Top Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1235.5 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 17104.5 | Top Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 590.7 | Bot Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 649.6 | Top Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 6104.1 | Top Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1209.7 | Top Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 306.0 | Bot Clear | 112.36 |
| GA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2034.4 | Bot Clear | 112.36 |
| Natural ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1531.7 | Top Clear | 112.36 |
| Adam-ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.30 | 10000 | Perfect (G30) | 15000 | 99458.6 | Top Clear | 112.36 |
| Adaptive ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1903.7 | Bot Clear | 112.36 |
| CEM | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2023.6 | Bot Clear | 112.36 |
| PSO | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 453.3 | Bot Clear | 112.36 |
| GA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 750.4 | Bot Clear | 112.36 |
| Adam-ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 3730.8 | Bot Clear | 112.36 |
| Diff. Evol. | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 385.9 | Bot Clear | 112.36 |
| CEM | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G14) | 7000 | 6951.0 | Top Clear | 112.36 |
| Neuro-CMA | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2218.1 | Bot Clear | 112.36 |
| PSO | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1427.5 | Vel Vy | 112.36 |
| Natural ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 3728.9 | Top Clear | 112.36 |
| Diff. Evol. | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 18165.9 | Bot Clear | 112.36 |
| Neuro-CMA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 6225.6 | Top Clear | 112.36 |
| Adam-ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 610.5 | Bot Clear | 112.36 |
| Natural ES | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1189.6 | Bot Clear | 112.36 |
| Adaptive ES | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 2027.1 | Top Clear | 112.36 |
| CEM | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 856.6 | Bot Clear | 112.36 |
| PSO | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 854.8 | Top Clear | 112.36 |
| Neuro-CMA | Easy | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 573.1 | Top Clear | 112.36 |
| Adaptive ES | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G17) | 8500 | 38111.5 | Bot Clear | 112.36 |
| GA | Hard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G20) | 10000 | 35021.2 | Bot Clear | 112.36 |
| Diff. Evol. | Standard | 5→8→4→1 | 2 | 12n | 76w | 89p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 645.5 | Bot Clear | 112.36 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 590.8 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 632.2 | Top Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G17) | 1020 | 4469.7 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 209 | STAGNATED (G35) | 2100 | 13773.7 | Top Clear | 1.62 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 334.4 | Bot Clear | 0 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 3493.1 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G31) | 1860 | 36510.7 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G38) | 2280 | 4327.9 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 1655.5 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 2199.9 | Top Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 565.2 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 4352.2 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 2160.1 | Bot Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 318.6 | Top Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 156.8 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 3105.6 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 12376.9 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 647.8 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G20) | 1200 | 2718.8 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 0 | STAGNATED (G30) | 1800 | 3969.7 | Bot Clear | 0 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 663.8 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 2610.0 | Top Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 2968.2 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 578.5 | Pipe DX | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 7407.3 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G30) | 1800 | 4178.3 | Bot Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 600.7 | Top Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 239.2 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 165.2 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 2041.8 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 140.2 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1923.1 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 2883.5 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 789.6 | Top Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 638.9 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 542.0 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 918.6 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 108.3 | Top Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 913.4 | Bot Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 731.0 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 448.9 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 1699.4 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 618.3 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1790.8 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 48 | STAGNATED (G31) | 1860 | 3724.0 | Top Clear | 0.37 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 5278.7 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 1102.0 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 3101.4 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 771.5 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 581.8 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 557.9 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1072.5 | Bot Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 2153.5 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 1965.9 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 917.0 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 217.4 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 3844.8 | Bot Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 100.1 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 3458.1 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G45) | 2700 | 44099.6 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 2303.6 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 9916.4 | Top Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 450.9 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 221 | STAGNATED (G19) | 1140 | 2502.2 | Bot Clear | 1.71 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 880.9 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 582.7 | Top Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 1018.0 | Pipe DX | 0 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 4776.7 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 622.6 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 170.9 | Bot Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 192.3 | Bot Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 4455.4 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 177.9 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G17) | 2550 | 8263.9 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 1010.2 | Bird Y | 0 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 8964.8 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 10929.0 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 16585.6 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 4896.2 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 912.3 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 7104.3 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1450.0 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2782.6 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1245.3 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 1021.5 | Vel Vy | 0 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 586.8 | Top Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 4920.3 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 2334.7 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 4199.9 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 192.0 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 5623.9 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2722.6 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 2744.7 | Bot Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 3895.2 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 16436.8 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 5216.3 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1366.5 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 2310.3 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2800.9 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 97 | STAGNATED (G21) | 3150 | 8630.8 | Top Clear | 0.75 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1016.8 | Top Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G24) | 3600 | 6835.0 | Top Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 467.3 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1934.9 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 329.0 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 581.8 | Top Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 229.1 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1671.3 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G13) | 1950 | 3774.2 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 3319.9 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 11391.1 | Top Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 887.3 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 6623.2 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1149.1 | Top Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 136 | STAGNATED (G20) | 3000 | 4566.6 | Top Clear | 1.05 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 847.2 | Top Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1762.2 | Top Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 827.8 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1734.2 | Bot Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 163.8 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 1 | STAGNATED (G25) | 3750 | 9647.1 | Bot Clear | 0.01 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 2787.4 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 9757.9 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 6034.5 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 651.9 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 2549.4 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 3589.1 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 4968.7 | Top Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 157.4 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 2239.7 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G25) | 3750 | 6163.9 | Top Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 2857.1 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 4914.2 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 467.6 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 2367.4 | Top Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1485.7 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1369.3 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 2250.1 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 7075.4 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 665.1 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 4512.2 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 2043.4 | Pipe DX | 0 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 2944.3 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 2000.4 | Bot Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 456.1 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 2995.7 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2244.1 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G19) | 5700 | 19816.1 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 285.0 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 802.0 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G16) | 4800 | 20154.5 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1407.9 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1011.2 | Top Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3663.9 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1128.6 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1714.2 | Top Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 265.5 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1274.2 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1394.0 | Top Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 4937.7 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 4857.8 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 1102.3 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 5909.5 | Top Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 527.6 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 7234.2 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 7301.6 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 416.6 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2141.9 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1733.4 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 449.6 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 772.8 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 2500.5 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 802.9 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 723.1 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 702.0 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 4167.7 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 636.3 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 448.8 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 348.9 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 790 | STAGNATED (G22) | 3300 | 19504.6 | Bot Clear | 6.12 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2745.0 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 337.0 | Top Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 669.4 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1490.1 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1154.7 | Top Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 4369.8 | Top Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 4670.5 | Top Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 11063.8 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 811.9 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 9449.4 | Top Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 452.7 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 6477.1 | Bot Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 602.4 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 3558.0 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G12) | 3600 | 6226.8 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 612.2 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 3711.9 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 6351.3 | Top Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 3003.6 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 3452.4 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 1018.5 | Top Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 10316.5 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 535.8 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G26) | 7800 | 7720.4 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 6975.0 | Bot Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 641.7 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 444.2 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 4876.9 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 5557.8 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 254.3 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 3386.8 | Vel Vy | 0 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 2071.9 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1912.7 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1709.9 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 3238.6 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 526.5 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 256.2 | Vel Vy | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 6798.8 | Bot Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1762.1 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 6064.5 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 557.8 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 8084.9 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 11760.3 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 6016.7 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1114.1 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G15) | 7500 | 18441.4 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 3534.5 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1959.7 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 2683.2 | Pipe DX | 0 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 7064.5 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 2552.5 | Top Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 4790.6 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 712.4 | Top Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 2282.6 | Top Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 478.7 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 4217.4 | Top Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 4075.3 | Bot Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 17502.7 | Top Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 1022.1 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 12113.0 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 390.2 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 4455.2 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3659.6 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 3185.5 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 2871.9 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 8420.2 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 5349.0 | Bot Clear | 77.52 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1813.7 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 477.8 | Bot Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 13640.5 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2341.3 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 695.0 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 3290.1 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 6474.5 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 3694.8 | Bot Clear | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 13769.8 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 4139.2 | Bot Clear | 77.52 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G14) | 7000 | 25748.5 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1966.3 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 664.9 | Top Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 7201.2 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 22447.7 | Bot Clear | 77.52 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1017.4 | Bot Clear | 77.52 |
| GA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 4378.3 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 11084.5 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 692.3 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 2095.6 | Top Clear | 77.52 |
| CEM | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 3951.1 | Bot Clear | 77.52 |
| PSO | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 607.5 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1160.3 | Bot Clear | 77.52 |
| CEM | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 1 | STAGNATED (G16) | 8000 | 13219.2 | Bot Clear | 0.01 |
| GA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 517.5 | Top Clear | 77.52 |
| Natural ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 5529.9 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2070.3 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 24365.2 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2546.3 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 453.2 | Vel Vy | 77.52 |
| PSO | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 449.3 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 856.5 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1935.1 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 445.1 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 3595.8 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 661.7 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1336.1 | Bot Clear | 77.52 |
| CEM | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 526.6 | Vel Vy | 77.52 |
| Neuro-CMA | Easy | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 763.2 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1343.8 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 393.8 | Top Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 209.4 | Bot Clear | 90.09 |
| PSO | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 10299.0 | Top Clear | 77.52 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 364.2 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 618.4 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 82.1 | Bot Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 5685.1 | Bot Clear | 90.09 |
| GA | Hard | 5→8→8→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 8940.6 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 4204.8 | Top Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1452.5 | Bot Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 977.3 | Top Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 13428.7 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 96.4 | Bot Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 562.0 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 348.1 | Bird Y | 0 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 166.2 | Top Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 724.2 | Pipe DX | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G24) | 1440 | 3975.4 | Top Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 389.0 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 765.7 | Top Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G33) | 1980 | 5801.6 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 10139.0 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1711.9 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 1657.3 | Top Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 633.8 | Top Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1966.4 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 1608.4 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 143.3 | Bot Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 7847.9 | Top Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 908 | STAGNATED (G26) | 1560 | 8306.3 | Bot Clear | 8.18 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 632.2 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 3984.7 | Top Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 1990.7 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 346.1 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 976.7 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 7327.1 | Bot Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1167.7 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 2420.2 | Vel Vy | 0 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 1465.9 | Pipe DX | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G24) | 1440 | 5268.7 | Top Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 173.5 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 9328.3 | Top Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 200.4 | Top Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1288.0 | Top Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 93.9 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 48 | STAGNATED (G21) | 1260 | 7411.9 | Bot Clear | 0.43 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 150.8 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 164.5 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 846.7 | Top Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G39) | 2340 | 4684.2 | Bot Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 868.3 | Top Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 548.3 | Top Clear | 0 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 7836.2 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 1978.7 | Pipe DX | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1738.2 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G26) | 1560 | 12242.4 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 750.3 | Top Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 841.2 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 3515.6 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 750.2 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 7128.8 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 1 | STAGNATED (G23) | 1380 | 2444.4 | Bot Clear | 0.01 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 96.5 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1755.4 | Bot Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 1168.5 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10 | STAGNATED (G56) | 3360 | 6609.8 | Top Clear | 0.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 867.8 | Bot Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 491.9 | Pipe DX | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 401.2 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 879.1 | Vel Vy | 0 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 419 | STAGNATED (G27) | 1620 | 6164.3 | Bot Clear | 3.77 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 1094.5 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 662.3 | Bot Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 197.9 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 3453.3 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 298.1 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 4 | STAGNATED (G16) | 2400 | 943.2 | Top Clear | 0.04 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 4335.1 | Top Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1087.1 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 5762.3 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G20) | 3000 | 31810.3 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 3555.6 | Bot Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 2487.8 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 498.7 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1257.7 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 247.7 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 5090.3 | Bot Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1723.0 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 851.7 | Top Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 2511.4 | Bot Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 4702.7 | Bot Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 388.0 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1389.8 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1717.5 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 0 | STAGNATED (G19) | 2850 | 5098.3 | Bird Y | 0 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 631.8 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 6360.6 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 4964.7 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 374.0 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G24) | 3600 | 7342.3 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 201.8 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1398.3 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1977.4 | Top Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 190.8 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 3356.9 | Top Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 587.2 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 741.4 | Bot Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 346.3 | Bot Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 239.5 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 338.5 | Bot Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 5493.0 | Top Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 242.8 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2463.7 | Top Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 11841.6 | Bot Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1460.7 | Top Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 241.9 | Top Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 150.9 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 120.7 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 861.8 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G20) | 3000 | 2108.4 | Top Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G15) | 2250 | 7339.9 | Bot Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 928.2 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G43) | 6450 | 12776.5 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 1613.7 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 251.9 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 3269.1 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 153.3 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 410.8 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G25) | 3750 | 2866.1 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 258.4 | Top Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 257.8 | Bot Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 913.6 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G17) | 2550 | 4189.4 | Top Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 808.3 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 5935.9 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 7392.6 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 545.8 | Top Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 762.0 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 2414.1 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 4613.5 | Top Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 3347.5 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 162.7 | Vel Vy | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 0 | STAGNATED (G29) | 4350 | 7837.6 | Bot Clear | 0 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 4103.3 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2615.6 | Top Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 2775.2 | Top Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 7461.8 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 5404.4 | Top Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2707.8 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 0 | STAGNATED (G29) | 8700 | 16007.2 | Bird Y | 0 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 310.9 | Top Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 3542.1 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2371.0 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 24635.8 | Bot Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 1107.1 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2667.3 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4058.7 | Bot Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 3063.4 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2560.2 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G18) | 5400 | 12048.3 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4278.3 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 244.3 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 792.5 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1654.6 | Top Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 9091.0 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 20196.8 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 8041.1 | Top Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 2419.6 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 2377.5 | Top Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 11787.4 | Bot Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 580.5 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 3289.2 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 473.9 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 255.7 | Bot Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1237.6 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 12247.4 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 318.5 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 9514 | STAGNATED (G23) | 6900 | 22558.5 | Top Clear | 85.71 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 7729.2 | Top Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 991.2 | Bot Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 246.0 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1445.0 | Bot Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 270.0 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G15) | 4500 | 10691.2 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 591.7 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 6817.4 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 320.2 | Top Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 876.9 | Top Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 364.1 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 3468.8 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1504.4 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 6761.8 | Top Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1096.6 | Top Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 792.2 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 2399.7 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G24) | 7200 | 18550.8 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 286.3 | Bot Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 5450.7 | Bot Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 604.5 | Vel Vy | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G16) | 4800 | 5182.5 | Top Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 9348.9 | Top Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 555.9 | Top Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 17859.7 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 541.6 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 3842.9 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G21) | 6300 | 9965.1 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 550.2 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1540.4 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 3962.4 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 218.2 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 2944.1 | Top Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 450.8 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 10789.3 | Top Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 2802.9 | Top Clear | 0 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 0 | STAGNATED (G19) | 9500 | 20305.9 | Pipe DX | 0 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 296.9 | Top Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 413.9 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 1786.1 | Top Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1591.6 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 3121.6 | Top Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 31 | STAGNATED (G17) | 5100 | 11244.7 | Top Clear | 0.28 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2194.4 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 557.9 | Top Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 2923.4 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 263.1 | Bot Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1372.6 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 521.0 | Vel Vy | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 805.6 | Top Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 6009.8 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 400.8 | Bot Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 3728.5 | Bot Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G21) | 10500 | 20224.5 | Bot Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 2300.4 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 11146.2 | Top Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1527.9 | Bot Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 523.9 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1479.5 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1728.0 | Bot Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 383.9 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 0 | STAGNATED (G17) | 8500 | 15447.8 | Top Clear | 0 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 395.8 | Bot Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 6054.4 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 3774.9 | Bot Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1488.3 | Bot Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 14798.2 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 551.0 | Top Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1449.6 | Bot Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 511.8 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 2 | STAGNATED (G30) | 15000 | 17262.1 | Bot Clear | 0.02 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 4422.0 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 5289.2 | Top Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 2055.5 | Top Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 484.4 | Top Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 632.7 | Top Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 482.7 | Top Clear | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 5387.5 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G15) | 7500 | 6114.1 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 4372.8 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 770.1 | Bot Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 6062.8 | Top Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 385.3 | Top Clear | 90.09 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1968.8 | Bot Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1552.2 | Bot Clear | 90.09 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 438.7 | Top Clear | 90.09 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 2590.1 | Top Clear | 90.09 |
| GA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 479.9 | Bot Clear | 90.09 |
| Natural ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1188.5 | Bot Clear | 90.09 |
| CEM | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1502.2 | Bot Clear | 90.09 |
| Diff. Evol. | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 5666.2 | Top Clear | 90.09 |
| Adaptive ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 3280.4 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G26) | 13000 | 24434.9 | Bot Clear | 90.09 |
| PSO | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 503.3 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G16) | 8000 | 6019.8 | Bot Clear | 90.09 |
| CEM | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 603.4 | Bot Clear | 90.09 |
| Adam-ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1684.7 | Bot Clear | 90.09 |
| Adaptive ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 813.8 | Top Clear | 90.09 |
| Diff. Evol. | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 556.7 | Top Clear | 90.09 |
| Neuro-CMA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2825.3 | Top Clear | 90.09 |
| PSO | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 3125.5 | Bot Clear | 90.09 |
| Adam-ES | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 330.5 | Bird Y | 90.09 |
| GA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 4973.5 | Top Clear | 90.09 |
| Neuro-CMA | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 11613.2 | Top Clear | 90.09 |
| Adaptive ES | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1940.6 | Top Clear | 90.09 |
| GA | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 12745.7 | Top Clear | 90.09 |
| CEM | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 516.1 | Bot Clear | 90.09 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 0 | STAGNATED (G29) | 1740 | 717.6 | Bot Clear | 0 |
| Natural ES | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 584.4 | Top Clear | 90.09 |
| Diff. Evol. | Standard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 4483.7 | Top Clear | 90.09 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 17.5 | Top Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1351.2 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 239.7 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 348.0 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 857.2 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 673.8 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 50.6 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1041.8 | Top Clear | 476.19 |
| Neuro-CMA | Easy | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 606.5 | Bot Clear | 90.09 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G30) | 1800 | 874.8 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 1558.9 | Bird Y | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 273.3 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 65.3 | Top Clear | 0 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 0 | STAGNATED (G20) | 1200 | 403.6 | Bot Clear | 0 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 30.5 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 207.7 | Top Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 923.8 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 0 | STAGNATED (G40) | 2400 | 389.8 | Top Clear | 0 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 394.1 | Bot Clear | 476.19 |
| PSO | Hard | 5→6→6→4→1 | 3 | 16n | 94w | 111p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 3841.5 | Bot Clear | 90.09 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 421.2 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 1045.4 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 40.5 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 0 | STAGNATED (G42) | 2520 | 983.2 | Bot Clear | 0 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 141.2 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 652.0 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 499.6 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 449.9 | Top Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 191.4 | Top Clear | 0 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 27.0 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 602.2 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 31.1 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 97.2 | Top Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 27.3 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 68.8 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 29.5 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 1121.3 | Top Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 388.4 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 132.1 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 79.9 | Top Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 313.1 | Top Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 37.6 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 176.5 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 0 | STAGNATED (G27) | 1620 | 162.4 | Top Clear | 0 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 3 | STAGNATED (G37) | 2220 | 575.4 | Top Clear | 0.14 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 36.9 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 158.9 | Bot Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 280.4 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 41.1 | Top Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 494.3 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 69.7 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 445.3 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G26) | 1560 | 1104.7 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 26.8 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 84.4 | Top Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 26 | STAGNATED (G20) | 1200 | 839.2 | Bot Clear | 1.24 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 554.6 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G28) | 1680 | 481.2 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 784.0 | Top Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 42.7 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 98.0 | Top Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 233.2 | Top Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 1524.8 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 583.6 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1489.3 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 84.4 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 63.0 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 171.3 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 52.3 | Top Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 131.9 | Vel Vy | 0 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 100.9 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 2052.2 | Bot Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 261.8 | Top Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 166.5 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 369.8 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 66 | STAGNATED (G17) | 2550 | 883.1 | Vel Vy | 3.14 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 124.4 | Top Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 47.5 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 79.4 | Top Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 787.3 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G26) | 3900 | 11984.5 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 51.8 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G42) | 6300 | 7959.3 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 26.6 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 2945.4 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1282.1 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 25.4 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 581.1 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 337.8 | Bot Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 206.2 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G18) | 2700 | 1603.8 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1167.6 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 213.0 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 1680.4 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 3557.9 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 353.4 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 230.2 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G34) | 5100 | 1399.7 | Top Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 146.5 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 209 | STAGNATED (G70) | 10500 | 34419.4 | Vel Vy | 9.95 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 718.1 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 586.7 | Top Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 586.3 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 831.0 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 405.7 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 109.3 | Top Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G22) | 3300 | 1264.6 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G21) | 3150 | 1606.1 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 191.6 | Bot Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 82.5 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 979.1 | Top Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 756.9 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 632.4 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 284.1 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 317.9 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 72.2 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 479.3 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 238.2 | Top Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 374.2 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 191.5 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 129.2 | Top Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 85.8 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 49.7 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 344.4 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 343.6 | Top Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 34.4 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1249.6 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 719.0 | Vel Vy | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G22) | 3300 | 1068.3 | Top Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 51.8 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G17) | 2550 | 1516.7 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 67.5 | Pipe DX | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 79.4 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 715.6 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 2259.7 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 1114.3 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 38.6 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 42.6 | Top Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G25) | 3750 | 1571.9 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 1276.8 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 424.5 | Top Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 351.0 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 55.5 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 557.1 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 206.0 | Top Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 105.2 | Top Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 1848.5 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 626.8 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 71.3 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 1240.9 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 780.3 | Top Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1764.1 | Top Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 389.7 | Top Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1119.2 | Bot Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 256.7 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G34) | 10200 | 5084.8 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 48.4 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 64.5 | Pipe DX | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 209.4 | Top Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 92.3 | Top Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2814.1 | Top Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 157.0 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1191.0 | Top Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 3480.5 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 92.4 | Top Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 723.2 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1560.2 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G32) | 9600 | 9928.4 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 278.7 | Top Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 446.6 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 66.8 | Top Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G19) | 5700 | 2903.5 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G20) | 6000 | 3467.7 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 228.3 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 516.2 | Top Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 38.0 | Top Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G13) | 3900 | 1589.8 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 200.5 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 59.0 | Pipe DX | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1011.3 | Top Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 209.6 | Bot Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 67.5 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 243.0 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 129.8 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 666.5 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 340.3 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 338.7 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G18) | 5400 | 2012.4 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 86.2 | Top Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 285.8 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 139.9 | Top Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 56.8 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 2674.4 | Top Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1911.2 | Bot Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G30) | 9000 | 780.0 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 302.3 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 133.8 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 391.9 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1049.9 | Top Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 200.8 | Top Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G12) | 3600 | 405.4 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 968.8 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1048.1 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 111.3 | Top Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 164.8 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 47.6 | Top Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 195.4 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 1033.6 | Top Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 741.1 | Top Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 198.3 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 449.9 | Top Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 145.8 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 297.8 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 181.4 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 59.6 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 929.9 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 38.1 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 107.5 | Top Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 638.8 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 572.5 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 167.7 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 154.4 | Top Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 246.2 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 5635.0 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 84.2 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 3849.9 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 554.4 | Vel Vy | 0 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 989.7 | Bot Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 216.9 | Top Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 882.8 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 4050.3 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 66.2 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 1667.0 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 1393.1 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 4945.9 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 349.0 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 609.7 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 440.6 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 6102.7 | Bot Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 87.3 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G20) | 10000 | 34531.8 | Top Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 227.0 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 502.6 | Pipe DX | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 4416.3 | Top Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 443.2 | Top Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G21) | 10500 | 5063.5 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 499.2 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 276.8 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 381.0 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 70.0 | Bot Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1455.5 | Bird Y | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 827.3 | Bot Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 0 | STAGNATED (G18) | 9000 | 621.3 | Top Clear | 0 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 532.5 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G40) | 20000 | 7820.3 | Top Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1187.3 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 757.9 | Bot Clear | 476.19 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 2995.0 | Top Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 217.9 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 254.0 | Bot Clear | 476.19 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 356.1 | Bot Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 893.7 | Top Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 678.8 | Bot Clear | 476.19 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 210.5 | Top Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 220.4 | Top Clear | 476.19 |
| GA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 600.4 | Top Clear | 476.19 |
| Adam-ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 639.3 | Bot Clear | 476.19 |
| CEM | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 246.1 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1171.4 | Top Clear | 476.19 |
| Diff. Evol. | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 561.0 | Bot Clear | 476.19 |
| PSO | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 86.6 | Bot Clear | 476.19 |
| Neuro-CMA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2006.0 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 312.0 | Bot Clear | 476.19 |
| Natural ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 615.8 | Bot Clear | 476.19 |
| GA | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 75.6 | Top Clear | 476.19 |
| Adaptive ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 432.0 | Top Clear | 476.19 |
| Adam-ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 404.6 | Bot Clear | 476.19 |
| CEM | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 874.7 | Top Clear | 476.19 |
| PSO | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 462.4 | Top Clear | 476.19 |
| Diff. Evol. | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 603.1 | Bot Clear | 476.19 |
| Adaptive ES | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 217.8 | Bot Clear | 476.19 |
| Natural ES | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G15) | 7500 | 629.9 | Top Clear | 476.19 |
| Adam-ES | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 439.8 | Bot Clear | 476.19 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 49.8 | Vel Vy | 0 |
| GA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 1910.4 | Bot Clear | 476.19 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G47) | 2820 | 1556.1 | Pipe DX | 0 |
| CEM | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 270.5 | Top Clear | 476.19 |
| PSO | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 788.8 | Bot Clear | 476.19 |
| Neuro-CMA | Easy | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 312.2 | Bot Clear | 476.19 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 206.1 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G54) | 3240 | 1964.7 | Top Clear | 625 |
| Diff. Evol. | Standard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 830.5 | Bot Clear | 476.19 |
| Neuro-CMA | Hard | 5→2→2→1 | 2 | 4n | 16w | 21p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 6600.5 | Bot Clear | 476.19 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 679.8 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G52) | 3120 | 994.2 | Vel Vy | 0 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 61.8 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 16.5 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 442.2 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G20) | 1200 | 773.3 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 49.5 | Top Clear | 0 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 49.6 | Bird Y | 0 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 223.7 | Pipe DX | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 356.5 | Top Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 0 | STAGNATED (G19) | 1140 | 58.9 | Vel Vy | 0 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 196.9 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G20) | 1200 | 1991.3 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 1377.0 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 743.7 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 434.8 | Bot Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 49.7 | Bird Y | 0 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 190.4 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 0 | STAGNATED (G43) | 2580 | 1166.1 | Bot Clear | 0 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 29.1 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 17.4 | Top Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 87.2 | Bot Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 92.7 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 521.9 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 35.8 | Top Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 554.3 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 604.0 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 0 | STAGNATED (G36) | 2160 | 576.2 | Bird Y | 0 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 109.6 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 266.9 | Top Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G21) | 1260 | 584.9 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 69.7 | Bot Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 0 | STAGNATED (G22) | 1320 | 222.2 | Bird Y | 0 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 52.6 | Pipe DX | 0 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 463.8 | Top Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 152.1 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 175.4 | Top Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 18.4 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 114.4 | Top Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 2 | STAGNATED (G20) | 1200 | 237.7 | Bot Clear | 0.13 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 166.5 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G25) | 1500 | 395.5 | Vel Vy | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 92.9 | Bot Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 27.5 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 667.9 | Top Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 133.0 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 5 | STAGNATED (G60) | 3600 | 995.0 | Bot Clear | 0.31 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 19.5 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 71.1 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 17 | STAGNATED (G16) | 960 | 253.7 | Top Clear | 1.06 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 14.9 | Top Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 34.5 | Top Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 383.6 | Top Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 295.0 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 14.8 | Bot Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 197.5 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 628 | STAGNATED (G30) | 1800 | 789.4 | Bot Clear | 39.25 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 42.8 | Top Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 287.8 | Bot Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 139.7 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 16.5 | Bot Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 112.1 | Bot Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 103.2 | Bot Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 255.7 | Top Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 124.3 | Bird Y | 0 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 91.4 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 233.2 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 184.6 | Top Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 19.5 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 138.2 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G23) | 3450 | 2111.7 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 51.5 | Top Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 65.4 | Bot Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 0 | STAGNATED (G18) | 2700 | 520.8 | Bird Y | 0 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 0 | STAGNATED (G21) | 3150 | 167.2 | Top Clear | 0 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 210.7 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 423.9 | Top Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G22) | 3300 | 1950.7 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 2389.3 | Top Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 783.5 | Top Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 0 | STAGNATED (G33) | 4950 | 244.9 | Top Clear | 0 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 0 | STAGNATED (G18) | 2700 | 801.2 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 103.4 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 230.0 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 213.0 | Bot Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 413.8 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 356.8 | Bot Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G19) | 2850 | 2558.4 | Bird Y | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 213.5 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 89.6 | Bot Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G28) | 4200 | 1147.8 | Top Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 709.0 | Top Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 843.9 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 849.4 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 175.5 | Top Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G39) | 5850 | 1956.2 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G25) | 3750 | 2051.8 | Top Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 147.3 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 678.5 | Top Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 2240.8 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 219.3 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 259.6 | Top Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 3496.3 | Bot Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 31.5 | Vel Vy | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 358.1 | Top Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 124.0 | Top Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 0 | STAGNATED (G31) | 4650 | 1252.9 | Bird Y | 0 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G15) | 2250 | 566.5 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 2169.1 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 251.1 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 330.0 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 63.6 | Bot Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 264.1 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 21.0 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 302.4 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 327.6 | Top Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G33) | 4950 | 3894.5 | Bot Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 44.7 | Top Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 463.9 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 63.6 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 38.9 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 251.0 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 55.2 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 672.8 | Vel Vy | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 68.3 | Top Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 241.9 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 37.6 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1646.1 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 234.5 | Top Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G49) | 7350 | 1802.8 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 368.0 | Bot Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 256.2 | Bot Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 327.2 | Bot Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 80.9 | Top Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 381.4 | Top Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G35) | 5250 | 1364.1 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G26) | 3900 | 575.0 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 63.1 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1191.4 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 965.1 | Top Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 116.6 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 325.6 | Top Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G29) | 8700 | 2559.1 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 0 | STAGNATED (G18) | 5400 | 259.2 | Pipe DX | 0 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 256.2 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 0 | STAGNATED (G17) | 5100 | 264.4 | Pipe DX | 0 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 0 | STAGNATED (G23) | 6900 | 2277.3 | Bird Y | 0 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 0 | STAGNATED (G18) | 5400 | 1355.0 | Vel Vy | 0 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G17) | 5100 | 1871.2 | Top Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 271.7 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 116.0 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 2849.1 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 63.1 | Bot Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 162.7 | Top Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 0 | STAGNATED (G30) | 9000 | 3208.4 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 162.1 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G20) | 6000 | 2765.5 | Bot Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 794.0 | Bot Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1445.6 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 183.0 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2150.7 | Top Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 0 | STAGNATED (G26) | 7800 | 427.2 | Vel Vy | 0 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 49.5 | Top Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 259.1 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 225.5 | Top Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.15 | 10000 | Perfect (G18) | 5400 | 2614.2 | Pipe DX | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 28.7 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 123.6 | Top Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G26) | 7800 | 1652.9 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G33) | 9900 | 2503.8 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 292.6 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 32.6 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 487.2 | Top Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 137.3 | Bot Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 298.7 | Top Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 120.0 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 986.3 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G22) | 6600 | 2517.6 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 121.1 | Bot Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 284.4 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 342.9 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 979.0 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 1 | STAGNATED (G16) | 4800 | 279.4 | Top Clear | 0.06 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 160.6 | Bot Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1988.1 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 131.2 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 49.7 | Top Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 995.0 | Top Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 615.6 | Bot Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 109.5 | Top Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G32) | 9600 | 7133.6 | Top Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 262.4 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G12) | 3600 | 390.0 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 427.8 | Top Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 65.0 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 696.2 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 32.8 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 110.2 | Top Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 608.1 | Top Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 310.5 | Bot Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 76.4 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 119.5 | Top Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 47.0 | Bot Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 119.4 | Top Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 82.8 | Bot Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 1319.9 | Bot Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 579.9 | Top Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 31.7 | Bot Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 739.0 | Bot Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 54.3 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 1826.3 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 152.6 | Top Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 60.0 | Top Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 312.8 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 420.5 | Pipe DX | 0 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 297.1 | Bot Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 639.0 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 74.5 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 141.9 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G19) | 9500 | 9298.8 | Bot Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 91.9 | Top Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G25) | 12500 | 4079.1 | Top Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 182.8 | Bot Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 417.4 | Top Clear | 0 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 509.4 | Top Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 1576.0 | Bot Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 5926.6 | Top Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 530.5 | Bot Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 267.0 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 2906.6 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 171.9 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 170.5 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 1 | STAGNATED (G20) | 10000 | 1668.4 | Bot Clear | 0.06 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 176.2 | Bot Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 69.2 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 6863.0 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 91.2 | Top Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 343.4 | Bot Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 940.2 | Top Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1558.4 | Top Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1079.1 | Bot Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 0 | STAGNATED (G17) | 8500 | 2212.6 | Bot Clear | 0 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 0 | STAGNATED (G17) | 8500 | 490.8 | Pipe DX | 0 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 676 | STAGNATED (G28) | 14000 | 3836.0 | Top Clear | 42.25 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 676.0 | Top Clear | 625 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 300 | 0.50 | 173 | STAGNATED (G75) | 22500 | 80282.7 | Bot Clear | 10.81 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G32) | 16000 | 4263.6 | Top Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 49.8 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 1534.6 | Bot Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 879.7 | Top Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 395.5 | Top Clear | 625 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G17) | 8500 | 1573.5 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 358.0 | Bot Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 58 | STAGNATED (G18) | 9000 | 831.6 | Bot Clear | 3.63 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1383.9 | Bot Clear | 625 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 236.1 | Bot Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 39.6 | Top Clear | 625 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 226.9 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 204.7 | Bot Clear | 625 |
| GA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 69.1 | Bot Clear | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 381.5 | Bot Clear | 625 |
| Natural ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 71.9 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G20) | 10000 | 1090.0 | Top Clear | 625 |
| Diff. Evol. | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 106.8 | Bot Clear | 625 |
| Natural ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 0 | STAGNATED (G16) | 8000 | 455.7 | Bird Y | 0 |
| CEM | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 129.4 | Bot Clear | 625 |
| PSO | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 56.3 | Top Clear | 625 |
| Adaptive ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 78.5 | Bot Clear | 625 |
| Adaptive ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 247.4 | Bot Clear | 625 |
| Neuro-CMA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 938.5 | Bot Clear | 625 |
| CEM | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 575.9 | Bot Clear | 625 |
| GA | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 2365.2 | Top Clear | 625 |
| PSO | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 51.0 | Bot Clear | 625 |
| Adam-ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 507.1 | Top Clear | 625 |
| Diff. Evol. | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 68.3 | Top Clear | 625 |
| GA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 254.8 | Top Clear | 625 |
| Adaptive ES | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 149.2 | Top Clear | 625 |
| Natural ES | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G14) | 7000 | 478.8 | Vel Vy | 625 |
| Diff. Evol. | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 133.4 | Bot Clear | 625 |
| CEM | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 119.7 | Bot Clear | 625 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 43.5 | Vel Vy | 0 |
| Neuro-CMA | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1187.6 | Bot Clear | 625 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 36.3 | Pipe DX | 0 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G30) | 1800 | 82.4 | Top Clear | 0 |
| Neuro-CMA | Easy | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 195.7 | Bot Clear | 625 |
| PSO | Hard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 699.9 | Bot Clear | 625 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 61.7 | Top Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G17) | 1020 | 46.7 | Bird Y | 0 |
| Adam-ES | Standard | 5→1→3→1 | 2 | 4n | 11w | 16p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 1251.0 | Bot Clear | 625 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G20) | 1200 | 259.4 | Vel Vy | 0 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 1049.6 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 316.4 | Top Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 134.9 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 637.0 | Top Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 43.7 | Vel Vy | 0 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 43.6 | Top Clear | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 43.1 | Pipe DX | 0 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 477.4 | Top Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 40.0 | Top Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 212.0 | Top Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G28) | 1680 | 1032.5 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 15.8 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G24) | 1440 | 465.8 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 43.6 | Pipe DX | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 3046.3 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 30.6 | Bot Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G32) | 1920 | 351.8 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 823.6 | Top Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 48.0 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 157.7 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 43.3 | Pipe DX | 0 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 35.9 | Bot Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 48.0 | Bird Y | 0 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 50.2 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 44.1 | Top Clear | 0 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 47.5 | Top Clear | 0 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 135.3 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 282.7 | Bot Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 824.4 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G18) | 1080 | 49.9 | Vel Vy | 0 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 542.9 | Bot Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 33.6 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 311.9 | Top Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 183.6 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 141.9 | Bird Y | 0 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G23) | 1380 | 427.5 | Bot Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 367.0 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 31 | STAGNATED (G16) | 960 | 56.3 | Bot Clear | 2.21 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 55.0 | Top Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 1193.7 | Bot Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 135.9 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 57 | STAGNATED (G29) | 1740 | 528.7 | Top Clear | 4.07 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 14.3 | Top Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 26.5 | Bot Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 324.6 | Bot Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 0 | STAGNATED (G16) | 960 | 42.9 | Bot Clear | 0 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 62.8 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 252.0 | Top Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 0 | STAGNATED (G38) | 2280 | 558.7 | Bot Clear | 0 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 545.3 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 34.6 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 0 | STAGNATED (G25) | 1500 | 482.7 | Bot Clear | 0 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 745.1 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G37) | 2220 | 389.9 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 58.7 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 48.6 | Bot Clear | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 217.8 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 0 | STAGNATED (G31) | 1860 | 173.3 | Top Clear | 0 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 3086.7 | Pipe DX | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 20.8 | Bot Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 110.3 | Bird Y | 0 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 102.3 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G23) | 3450 | 148.5 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 69.6 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G19) | 2850 | 723.8 | Bird Y | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 216.6 | Top Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 31.1 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 110.8 | Bot Clear | 0 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 109.7 | Bird Y | 0 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 109.3 | Vel Vy | 0 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G22) | 1320 | 3492.2 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 604.6 | Bot Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 1478.8 | Bot Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 288.0 | Pipe DX | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 582.7 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 179.9 | Bot Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 146.5 | Bot Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 484.9 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 110.0 | Bird Y | 0 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 548.6 | Top Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G17) | 2550 | 118.0 | Bot Clear | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 87.4 | Top Clear | 0 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 112.0 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 85.5 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 284.8 | Bot Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G23) | 3450 | 158.4 | Bird Y | 0 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 110.1 | Bird Y | 0 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 42.3 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 13.1 | Top Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 1316.2 | Top Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 1 | STAGNATED (G98) | 14700 | 14956.3 | Bot Clear | 0.07 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 76.5 | Bot Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 506.1 | Vel Vy | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 109.8 | Bird Y | 0 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 109.9 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 80.1 | Bot Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 76.0 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G19) | 2850 | 216.8 | Top Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 81.0 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 321.2 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G64) | 9600 | 2192.7 | Bot Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G37) | 5550 | 2667.5 | Bot Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 104.0 | Bot Clear | 714.29 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 110.1 | Bot Clear | 0 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 42.6 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G18) | 2700 | 122.9 | Top Clear | 0 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 108.5 | Vel Vy | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 48.4 | Bot Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 0 | STAGNATED (G29) | 4350 | 200.4 | Bot Clear | 0 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 174.6 | Top Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 119.4 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 623.5 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 357.0 | Bot Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 622.8 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 25.6 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G42) | 6300 | 2043.0 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 232.3 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 24 | STAGNATED (G17) | 2550 | 175.9 | Bot Clear | 1.71 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 176.3 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 97.5 | Top Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 170.7 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 33.5 | Bot Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 13.6 | Pipe DX | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 13.2 | Top Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 335.5 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 16.1 | Top Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 0 | STAGNATED (G22) | 3300 | 152.4 | Bot Clear | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 0 | STAGNATED (G18) | 2700 | 220.4 | Bot Clear | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 154.4 | Bot Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G34) | 5100 | 1129.4 | Top Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 227.6 | Bot Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 71.3 | Bot Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 222.6 | Bird Y | 0 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 119.7 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 238.1 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 153.3 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 0 | STAGNATED (G35) | 10500 | 2655.3 | Bird Y | 0 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 493.5 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G18) | 2700 | 1740.9 | Top Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 50.2 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 0 | STAGNATED (G19) | 5700 | 253.3 | Bird Y | 0 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 220.9 | Vel Vy | 0 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 86.8 | Bot Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 663.1 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 127.6 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G22) | 6600 | 4436.4 | Top Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 392.7 | Bot Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 22.4 | Bot Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 220.9 | Bot Clear | 0 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 150 | 0.50 | 10000 | Perfect (G26) | 3900 | 6156.5 | Top Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G14) | 4200 | 1320.8 | Bot Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G14) | 4200 | 1853.5 | Top Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 217.6 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 633.6 | Top Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G16) | 4800 | 433.9 | Bot Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 176.9 | Top Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G17) | 5100 | 230.9 | Vel Vy | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 1330.6 | Bot Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G41) | 12300 | 1286.8 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G22) | 6600 | 617.6 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G22) | 6600 | 6113.2 | Bot Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 508.9 | Vel Vy | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 41.9 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 461.2 | Top Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G16) | 4800 | 224.0 | Top Clear | 0 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 61.6 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G15) | 4500 | 887.0 | Top Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 68.8 | Top Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G18) | 5400 | 248.5 | Vel Vy | 0 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 364.0 | Top Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 149.6 | Top Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 101.7 | Bot Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G16) | 4800 | 225.4 | Vel Vy | 0 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G20) | 6000 | 278.7 | Top Clear | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 0 | STAGNATED (G19) | 5700 | 619.7 | Bot Clear | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 578.2 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 234.1 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1604.1 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 55.0 | Top Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 2305.6 | Top Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 109.3 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 124.7 | Bot Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 97.0 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 10000 | Perfect (G32) | 9600 | 23395.3 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 121.3 | Top Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 75.6 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 74.2 | Pipe DX | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 305.8 | Bot Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 80.3 | Top Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 0 | STAGNATED (G24) | 7200 | 341.0 | Bird Y | 0 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 74.0 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 87.8 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 320.8 | Top Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 325.6 | Top Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.15 | 5614 | STAGNATED (G38) | 11400 | 49193.4 | Bot Clear | 401 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 23.7 | Top Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 22.6 | Bot Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G20) | 6000 | 653.8 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 93.4 | Bot Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 91.4 | Top Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 291.1 | Top Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G18) | 5400 | 1413.3 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 205.7 | Bot Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 126.3 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 1 | STAGNATED (G24) | 7200 | 373.2 | Bot Clear | 0.07 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 368.9 | Vel Vy | 0 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 368.8 | Bot Clear | 0 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 919.4 | Bot Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 307.1 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 791.3 | Top Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 369.1 | Top Clear | 0 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 218.7 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 783.1 | Bot Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 257.3 | Top Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G18) | 9000 | 403.7 | Vel Vy | 0 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 223.9 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 514.7 | Top Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 339.8 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 129.6 | Bot Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1047.6 | Bot Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G15) | 7500 | 475.8 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 1263.1 | Bot Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 44.2 | Bot Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 193.8 | Top Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G32) | 16000 | 744.5 | Vel Vy | 0 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 40.5 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 2059.3 | Bot Clear | 714.29 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 0 | STAGNATED (G35) | 17500 | 3346.0 | Bird Y | 0 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 401.7 | Bot Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 478.1 | Top Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 38.7 | Bot Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 159.0 | Bot Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 184.1 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 3921.0 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 71.5 | Top Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 297.8 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 1464.3 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 0 | STAGNATED (G17) | 8500 | 1358.1 | Top Clear | 0 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 2110.2 | Top Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 0 | STAGNATED (G21) | 10500 | 468.0 | Bird Y | 0 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 34.2 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 422.6 | Top Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 338.1 | Top Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G50) | 25000 | 5600.8 | Bot Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 0 | STAGNATED (G23) | 11500 | 526.4 | Pipe DX | 0 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G42) | 21000 | 6756.2 | Bot Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G14) | 7000 | 505.0 | Bot Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 38.0 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 31 | STAGNATED (G24) | 12000 | 593.2 | Bot Clear | 2.21 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G15) | 7500 | 680.8 | Bot Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 207.5 | Top Clear | 714.29 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 143.0 | Top Clear | 714.29 |
| Natural ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 0 | STAGNATED (G17) | 8500 | 399.3 | Bot Clear | 0 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 140.5 | Top Clear | 714.29 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 61.1 | Top Clear | 714.29 |
| GA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 51.3 | Bot Clear | 714.29 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 414.0 | Bot Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 32.0 | Top Clear | 714.29 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 640.5 | Bot Clear | 714.29 |
| Adaptive ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 276.8 | Bot Clear | 714.29 |
| Diff. Evol. | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 195.1 | Bot Clear | 714.29 |
| CEM | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 273.0 | Bot Clear | 714.29 |
| Natural ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 0 | STAGNATED (G22) | 11000 | 511.2 | Top Clear | 0 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 939.5 | Bot Clear | 714.29 |
| PSO | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 36.6 | Bot Clear | 714.29 |
| Adam-ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G36) | 18000 | 3781.3 | Bot Clear | 714.29 |
| GA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 483.6 | Top Clear | 714.29 |
| Adaptive ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 228.0 | Bot Clear | 714.29 |
| Neuro-CMA | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1458.6 | Top Clear | 714.29 |
| Adam-ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 242.9 | Bot Clear | 714.29 |
| Adam-ES | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 0 | STAGNATED (G16) | 8000 | 371.0 | Vel Vy | 0 |
| PSO | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 62.8 | Bot Clear | 714.29 |
| Neuro-CMA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 488.1 | Top Clear | 714.29 |
| GA | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 297.2 | Bot Clear | 714.29 |
| Diff. Evol. | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 283.1 | Bot Clear | 714.29 |
| Adaptive ES | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 899.0 | Top Clear | 714.29 |
| Natural ES | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 62.0 | Top Clear | 714.29 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 0 | STAGNATED (G26) | 1560 | 717.7 | Top Clear | 0 |
| PSO | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 124.8 | Bot Clear | 714.29 |
| CEM | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 79.1 | Bot Clear | 714.29 |
| Diff. Evol. | Standard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 33.8 | Bot Clear | 714.29 |
| CEM | Hard | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G23) | 11500 | 4658.6 | Top Clear | 714.29 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 1249.1 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 120.3 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 1367.3 | Top Clear | 370.37 |
| Neuro-CMA | Easy | 5→1→1→1→1→1 | 4 | 4n | 9w | 14p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 2286.9 | Bot Clear | 714.29 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 64.3 | Bot Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 170.0 | Top Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 1038.2 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 253.6 | Top Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 41.9 | Top Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 2523.9 | Top Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 0 | STAGNATED (G18) | 1080 | 96.1 | Top Clear | 0 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 81.4 | Top Clear | 0 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 247.8 | Top Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 0 | STAGNATED (G31) | 1860 | 640.6 | Top Clear | 0 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 267.7 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 1854.4 | Top Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 331.6 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 508.1 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 0 | STAGNATED (G19) | 1140 | 102.6 | Bot Clear | 0 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 189.5 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 51.3 | Top Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 318.9 | Pipe DX | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 114.1 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 70.0 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G51) | 3060 | 1272.7 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 424.4 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 700.2 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 814.8 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 60.8 | Bot Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 475.6 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 842.4 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G37) | 2220 | 1318.3 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 0 | STAGNATED (G20) | 1200 | 913.9 | Pipe DX | 0 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 21.8 | Top Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 636.4 | Top Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G50) | 3000 | 2045.2 | Top Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 173.9 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 138.1 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 66.7 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 309.7 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 297.1 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 184.1 | Top Clear | 0 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 5 | STAGNATED (G31) | 1860 | 797.0 | Bot Clear | 0.19 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 719.3 | Top Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 903.4 | Top Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 67.2 | Bot Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G24) | 1440 | 538.6 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 69.8 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 134.9 | Top Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 672.4 | Top Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 84.5 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 3 | STAGNATED (G19) | 1140 | 169.6 | Top Clear | 0.11 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 0 | STAGNATED (G22) | 1320 | 589.9 | Bird Y | 0 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 0 | STAGNATED (G24) | 1440 | 607.8 | Bot Clear | 0 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 89.0 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 661.6 | Bot Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 16.5 | Top Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 97.1 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 0 | STAGNATED (G16) | 960 | 90.5 | Vel Vy | 0 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 175.1 | Top Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 59.6 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 175.6 | Top Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 152.9 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 312.5 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 49.6 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 422.1 | Top Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 207.2 | Vel Vy | 0 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G55) | 3300 | 2747.7 | Top Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 729.8 | Bot Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 93.0 | Top Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G36) | 2160 | 2266.0 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 48.1 | Top Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 135.3 | Top Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 1628.3 | Bot Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 364.7 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 104.4 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 1895.4 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 406.6 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 6375.6 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G28) | 4200 | 3158.3 | Top Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 53.6 | Top Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 119.7 | Top Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 212.2 | Vel Vy | 0 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 210.0 | Bird Y | 0 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 0 | STAGNATED (G20) | 3000 | 1413.6 | Pipe DX | 0 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G18) | 2700 | 1378.6 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 82.6 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 1195.4 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1897.1 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 1438.6 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 47.3 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 439.0 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 593.7 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 444.2 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 135.0 | Vel Vy | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 357.4 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 68.5 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G29) | 4350 | 2339.4 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 166.8 | Top Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1236.8 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 2220.3 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 95.2 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 141.3 | Top Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 549.6 | Top Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 215.0 | Top Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G21) | 3150 | 1815.9 | Bot Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 169.9 | Top Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 881.7 | Bot Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 212.4 | Pipe DX | 0 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 67.3 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 819.5 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 3047.8 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 139.9 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 900.1 | Top Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 733.3 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 389.2 | Bot Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 846.8 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G16) | 2400 | 1883.5 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 712.9 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 572.9 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G33) | 4950 | 1019.7 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 51.3 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 46.8 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 0 | STAGNATED (G27) | 4050 | 982.6 | Bot Clear | 0 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 426.0 | Top Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 415.8 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 593.3 | Top Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1946.3 | Top Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1413.3 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 121.3 | Top Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 514.3 | Bot Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 604.4 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 55.3 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 89.2 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 402.6 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 111.9 | Top Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 166.6 | Top Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1094.4 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 423.9 | Pipe DX | 0 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 418.2 | Pipe DX | 0 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G17) | 2550 | 4113.2 | Bot Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 28.3 | Top Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 133.0 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 218.6 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 498.5 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 114.7 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 144.0 | Top Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 333.6 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 0 | STAGNATED (G18) | 5400 | 472.3 | Vel Vy | 0 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 2437.9 | Top Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 295.5 | Bot Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1303.2 | Bot Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 146.9 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 651.5 | Top Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 110.1 | Bot Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1086.7 | Top Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 0 | STAGNATED (G17) | 5100 | 454.7 | Top Clear | 0 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 313.1 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 165.5 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 449.9 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 2013.0 | Top Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 116.3 | Top Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G53) | 15900 | 10127.7 | Top Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 1 | STAGNATED (G17) | 5100 | 1544.9 | Bot Clear | 0.04 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 288.0 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 1265.0 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 55.6 | Bot Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1239.0 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 850.8 | Pipe DX | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3871.3 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 609.5 | Bot Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 69.3 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G22) | 6600 | 4413.5 | Bot Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 254.8 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 877.5 | Top Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 615.5 | Top Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1337.3 | Bot Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 1374.7 | Top Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G14) | 4200 | 2270.3 | Bot Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1205.5 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 449.9 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 795.9 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 435.1 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2605.7 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 302.2 | Top Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 531.3 | Bot Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 134.1 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 194.5 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 67.5 | Top Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 78.6 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G19) | 5700 | 1769.1 | Top Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 71.6 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2821.0 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 3868.9 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G30) | 9000 | 3147.3 | Top Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1469.9 | Top Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 1283.6 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 213.5 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1085.2 | Bot Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2716.8 | Top Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 165.8 | Top Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 157.2 | Top Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G46) | 13800 | 5694.9 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 66.4 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 2013.9 | Top Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G21) | 6300 | 3281.1 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 415.0 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 48.0 | Top Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 767.1 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 3601.1 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 644.0 | Top Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 495.8 | Bot Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 55.5 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 704.5 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 103.9 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 186.3 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 415.3 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 53.4 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 259.4 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 110.3 | Bot Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 86.6 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G23) | 11500 | 9014.2 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1001.6 | Bot Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 298.0 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 3340.9 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 213.8 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 3088.4 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G35) | 17500 | 13272.7 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G34) | 17000 | 17812.4 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 276.6 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G18) | 9000 | 10841.7 | Bot Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 803.6 | Bot Clear | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 730.5 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2201.2 | Top Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G10) | 5000 | 1200.5 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 846.3 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 245.5 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 415.4 | Bot Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 3662.5 | Top Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 274.8 | Top Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 97.1 | Bot Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G16) | 8000 | 2697.0 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 718.6 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 388.4 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1274.9 | Bot Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 2870.8 | Bot Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 0 | STAGNATED (G16) | 8000 | 3807.5 | Bird Y | 0 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 96.6 | Bot Clear | 370.37 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 368.8 | Top Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 459.5 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 999.7 | Top Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 79.9 | Top Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 432.4 | Top Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 220.0 | Bot Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 258.9 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 254.9 | Top Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 532.4 | Top Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 3078.7 | Top Clear | 370.37 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 274.8 | Top Clear | 370.37 |
| Natural ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 192 | STAGNATED (G22) | 11000 | 1098.7 | Bot Clear | 7.11 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 151.5 | Bot Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 222.8 | Bot Clear | 370.37 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 1995.4 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 613.1 | Bot Clear | 370.37 |
| GA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 100.6 | Top Clear | 370.37 |
| Diff. Evol. | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 177.4 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1733.5 | Bot Clear | 370.37 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 86.7 | Top Clear | 370.37 |
| PSO | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 92.2 | Bot Clear | 370.37 |
| CEM | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 928.4 | Bot Clear | 370.37 |
| GA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 83.5 | Top Clear | 370.37 |
| Neuro-CMA | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 173.4 | Top Clear | 370.37 |
| Adam-ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 408 | STAGNATED (G25) | 12500 | 5996.6 | Bot Clear | 15.11 |
| Natural ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 449.7 | Bot Clear | 370.37 |
| Adam-ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 332.1 | Bot Clear | 370.37 |
| Diff. Evol. | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 434.3 | Bot Clear | 370.37 |
| PSO | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 93.8 | Bot Clear | 370.37 |
| Neuro-CMA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 212.7 | Top Clear | 370.37 |
| CEM | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G21) | 10500 | 4993.7 | Top Clear | 370.37 |
| Adaptive ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2433.4 | Bot Clear | 370.37 |
| Adam-ES | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 64.7 | Top Clear | 370.37 |
| GA | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 552.2 | Bot Clear | 370.37 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 90.4 | Bird Y | 0 |
| Natural ES | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 317.8 | Top Clear | 370.37 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 89.6 | Top Clear | 0 |
| CEM | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 677.8 | Vel Vy | 370.37 |
| Adaptive ES | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 2794.3 | Bot Clear | 370.37 |
| PSO | Hard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 698.2 | Top Clear | 370.37 |
| Diff. Evol. | Standard | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 78.6 | Bot Clear | 370.37 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 76.5 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→2→2→1 | 3 | 6n | 20w | 27p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 3404.6 | Bot Clear | 370.37 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 483.8 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 60.2 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 591.8 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 0 | STAGNATED (G18) | 1080 | 627.5 | Bird Y | 0 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 89.9 | Pipe DX | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 659.3 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G29) | 1740 | 1269.5 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 90.3 | Bird Y | 0 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 100.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 91.8 | Top Clear | 0 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 782.1 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 122.1 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 2354.8 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 347.5 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G33) | 1980 | 2201.1 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 2364.8 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1069.6 | Top Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 236.3 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 22.8 | Bot Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 497.2 | Vel Vy | 0 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 84.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 192.0 | Top Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 139.7 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 704.1 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 77.3 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 553.4 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 434.1 | Top Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1103.3 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 1001.0 | Top Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 47.9 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 552.3 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 147.2 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 266.1 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 41.0 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 261.1 | Top Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 772.5 | Top Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G59) | 3540 | 5919.5 | Top Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 202.7 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G24) | 1440 | 692.5 | Top Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 2417.6 | Bot Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 93.0 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 757.6 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 199.7 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 41.1 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 81.8 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 36.8 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 134.6 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G21) | 1260 | 370.7 | Vel Vy | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 351.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 77.1 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 21.6 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 633.9 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 1430.0 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 479.2 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G19) | 1140 | 249.2 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 81.4 | Top Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 117.2 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 247.5 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 182.8 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 379.4 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 1324.1 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 165.3 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 916.3 | Top Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 228.6 | Pipe DX | 0 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 0 | STAGNATED (G17) | 2550 | 241.8 | Top Clear | 0 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 47.5 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 129.2 | Bot Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 0 | STAGNATED (G37) | 5550 | 3618.7 | Bird Y | 0 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 5566.9 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 310.8 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 172.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 60 | 0.50 | 10000 | Perfect (G40) | 2400 | 2281.8 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 542.2 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 187.9 | Bot Clear | 0 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 248.5 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 72.8 | Top Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 181.9 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 1568.1 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1739.9 | Bird Y | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 517.3 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 586.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 0 | STAGNATED (G20) | 3000 | 1723.0 | Bot Clear | 0 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 145.7 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 177.2 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G23) | 3450 | 4455.4 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 587.3 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G16) | 2400 | 833.4 | Top Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G21) | 3150 | 3923.2 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 750.1 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 509.4 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 827.9 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 134.1 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 397.0 | Top Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1202.6 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G39) | 5850 | 3162.3 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1217.5 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 146.5 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 543.1 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 163.3 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 120.4 | Bot Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G24) | 3600 | 3767.6 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 483.5 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 118.5 | Top Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 168.9 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 147.9 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 47.5 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 2515.7 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 1110.6 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 366.1 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 377.2 | Top Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 1703.2 | Top Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 105.7 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G20) | 3000 | 1764.1 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1451.6 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 80.7 | Top Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 531.7 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 1021.8 | Top Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 86.5 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 223.0 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 253.1 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 363.7 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.30 | 2659 | STAGNATED (G21) | 3150 | 4946.2 | Top Clear | 91.69 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 30.0 | Top Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 103.9 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G19) | 2850 | 651.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 635.7 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 61.6 | Bot Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 786.7 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 1509.2 | Top Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 254.1 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 37.8 | Pipe DX | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G20) | 3000 | 3699.1 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 685.4 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 4391.8 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 45.3 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 735.2 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 69.4 | Top Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 188.5 | Top Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 703.5 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 127.7 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 327.1 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 138.8 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G16) | 4800 | 3316.8 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1404.7 | Top Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 322.2 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G21) | 6300 | 6472.5 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 3093.4 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 173.2 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 86.0 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 3614.5 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 364.4 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 264.5 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G25) | 7500 | 8462.0 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 191.8 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 202.0 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 393.8 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 708.4 | Bot Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 208.0 | Bot Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 1402.7 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 512.1 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 1970.3 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 689.8 | Top Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 68.2 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 357.7 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 659.4 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 4992.9 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 297.3 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 801.6 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2185.2 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 83.4 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 243.5 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G25) | 7500 | 2553.4 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 148.2 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G30) | 9000 | 5317.5 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2834.7 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 246.3 | Bot Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G28) | 8400 | 4908.8 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1993.3 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 2505.4 | Top Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1681.0 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 141.7 | Top Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1870.1 | Bot Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 77.7 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 2484.1 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 566.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1500.9 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 54.6 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 4451.3 | Bot Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.15 | 10000 | Perfect (G43) | 12900 | 74438.6 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 437.1 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 290.6 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 232.1 | Top Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 143.9 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 161 | STAGNATED (G17) | 5100 | 1464.3 | Top Clear | 5.55 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 830.0 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 260.3 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 99.6 | Pipe DX | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 65.5 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 120.9 | Bot Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 943.9 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 349.9 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1796.0 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 1093.1 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 67.4 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 583.6 | Top Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 118.7 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 729.7 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 721.5 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 1321.5 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 323.8 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 836.0 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 0 | STAGNATED (G19) | 9500 | 5288.6 | Top Clear | 0 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 103.6 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 120.3 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 317.7 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 758.7 | Pipe DX | 0 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 263.5 | Top Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 171.3 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 600.4 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 5971.9 | Top Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1234.5 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 300 | 0.50 | 10000 | Perfect (G17) | 5100 | 9777.5 | Top Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 12005.9 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G10) | 5000 | 3200.9 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 135.2 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 106.2 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 0 | STAGNATED (G25) | 12500 | 6759.2 | Top Clear | 0 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G55) | 27500 | 15017.7 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G21) | 10500 | 11143.3 | Top Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 118.2 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 311.6 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 1392.7 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 7710.3 | Top Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 537.4 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 158.2 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 20307.8 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 887.1 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 7606.6 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 13964.7 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 370.3 | Top Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 143.3 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G36) | 18000 | 9942.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 162.9 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 4610.2 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 671.4 | Top Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 1082.7 | Top Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 499.6 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 157.1 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1677.5 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1381.3 | Bot Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1037.2 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 315.6 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2103.2 | Top Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 391.5 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 586.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1191.3 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 117.2 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 448.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 812.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 480.4 | Bot Clear | 344.83 |
| GA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 284.0 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 1 | STAGNATED (G32) | 16000 | 7393.5 | Bot Clear | 0.03 |
| Natural ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 444.5 | Top Clear | 344.83 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1458.8 | Top Clear | 344.83 |
| PSO | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 151.5 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 481.2 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2793.3 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 199.9 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 82.3 | Bot Clear | 344.83 |
| GA | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 628.7 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 70.6 | Top Clear | 344.83 |
| CEM | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 257.6 | Bot Clear | 344.83 |
| CEM | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 2095.3 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 153.4 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G34) | 17000 | 7083.9 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1280.2 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 147.5 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 245.7 | Bot Clear | 344.83 |
| PSO | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 3409.4 | Top Clear | 344.83 |
| GA | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 192.1 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 90.1 | Bird Y | 0 |
| CEM | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 211.0 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 0 | STAGNATED (G18) | 1080 | 100.2 | Pipe DX | 0 |
| PSO | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 210.2 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 98.4 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1412.1 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→2→4→1 | 2 | 6n | 22w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 83.1 | Top Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 182.1 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 106.3 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 192.5 | Top Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 0 | STAGNATED (G25) | 1500 | 742.4 | Bird Y | 0 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 345 | STAGNATED (G22) | 1320 | 1626.0 | Top Clear | 11.9 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 1725.4 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1435.2 | Top Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 59.8 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 2375.1 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 755.1 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 90.8 | Bot Clear | 0 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 53.9 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 5761 | STAGNATED (G41) | 2460 | 21185.2 | Top Clear | 198.66 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G21) | 1260 | 835.3 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 413.3 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 580.0 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 125.1 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 353.3 | Pipe DX | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 66.8 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 34.7 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 480.7 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 76.9 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 1802.1 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 87.8 | Bird Y | 0 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 168.8 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 260.5 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 737.2 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G21) | 1260 | 572.7 | Bot Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 0 | STAGNATED (G21) | 1260 | 553.4 | Bird Y | 0 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 21.1 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 49.7 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 910.1 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 755.3 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1098.7 | Bot Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 140.6 | Top Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 83.5 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 783.3 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 441.8 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 134.5 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 643.8 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 92.8 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 0 | STAGNATED (G31) | 1860 | 647.7 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 145.3 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 50.1 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1326.1 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 307.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 63.6 | Bot Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 316.2 | Vel Vy | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 76.6 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 134.6 | Top Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 125.4 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 529.3 | Top Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 255.1 | Bot Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 36.1 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 855.9 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 485.1 | Top Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 44.6 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 111.5 | Bird Y | 0 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 287 | STAGNATED (G68) | 4080 | 2446.0 | Top Clear | 9.9 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 144.1 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 79.3 | Top Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 472.2 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 249.1 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 66.0 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 183.9 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 213.4 | Bird Y | 0 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 37.2 | Vel Vy | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 198.1 | Pipe DX | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 1115.4 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1636.9 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 52.7 | Vel Vy | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 196.3 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 94.5 | Top Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 0 | STAGNATED (G30) | 4500 | 2910.3 | Bot Clear | 0 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 64.2 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 780.6 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 155.3 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1330.8 | Bird Y | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 722.6 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G22) | 3300 | 3046.9 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 34.6 | Top Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 224.3 | Vel Vy | 0 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 1706.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 229.7 | Vel Vy | 0 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 244.0 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 1056.9 | Top Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 2539.4 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 41.8 | Bot Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 396.7 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 3388.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 356.6 | Top Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 1053.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 60 | 0.50 | 4615 | STAGNATED (G24) | 1440 | 2063.6 | Bot Clear | 159.14 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 411.0 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 647.6 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 730.0 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 113.9 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 418.6 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 335.2 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 64.5 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 551.3 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 620.7 | Top Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 807.8 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 170.4 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 640.5 | Top Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 68.1 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 878.8 | Top Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 396.5 | Bot Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G13) | 1950 | 814.5 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G16) | 2400 | 7373.5 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 518.6 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 110.6 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 336.6 | Pipe DX | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 210.1 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 1089.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G25) | 3750 | 1987.6 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 523.3 | Top Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 204.9 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 782.8 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 854.9 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 179.6 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 118.0 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 632.7 | Top Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 267.0 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 105.6 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 184.6 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 529.4 | Top Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 231.8 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 86.4 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1191.8 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 122.9 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 182.9 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 702.6 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G19) | 2850 | 1805.4 | Bot Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 716.8 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 34.5 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 451.5 | Vel Vy | 0 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 85.6 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 860.4 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 435.4 | Bot Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 56.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 34.6 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1493.5 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 75.3 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 427.2 | Top Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1212.0 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 145.8 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 976.4 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G28) | 8400 | 6103.1 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 5073.4 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G43) | 12900 | 11099.4 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 227.2 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 456.9 | Pipe DX | 0 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G17) | 5100 | 2489.9 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 717.4 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 0 | STAGNATED (G21) | 6300 | 2537.0 | Pipe DX | 0 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 62.9 | Top Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G24) | 7200 | 5559.7 | Top Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 1768.0 | Top Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 281.4 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 2051.0 | Bot Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 677.9 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 423.6 | Top Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 75.2 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1080.4 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 68.3 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 114.3 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G26) | 7800 | 5970.0 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.15 | 10000 | Perfect (G26) | 7800 | 13982.6 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 594.4 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 452.7 | Top Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 242.4 | Top Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 215.9 | Bot Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 395.7 | Top Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 525.0 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 805.0 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 500.5 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 966.1 | Bot Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 305.8 | Bot Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G27) | 8100 | 6434.1 | Pipe DX | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 283.1 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 536.3 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 2446.5 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 606.9 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 58.9 | Bot Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 45.2 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 55.9 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 367.4 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G16) | 4800 | 2330.7 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 2831.9 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 298.3 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 230.0 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 981.6 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 57.3 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1168.0 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 255.3 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 6508.4 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G23) | 6900 | 1227.7 | Top Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 92.2 | Vel Vy | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 578.6 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 64.8 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 717.7 | Bot Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 432.8 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 720.1 | Top Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 188.6 | Pipe DX | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 65.4 | Top Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G12) | 3600 | 1723.0 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1120.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 501.6 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 149.1 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 369.3 | Top Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 757.8 | Vel Vy | 0 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 453.3 | Top Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 598.5 | Pipe DX | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 539.1 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 133.1 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 188.7 | Top Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1118.0 | Top Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 553.1 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 5032.2 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1736.6 | Pipe DX | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 688.5 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 3003.9 | Bot Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 350.6 | Top Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 130.7 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 9357.0 | Bot Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 94.7 | Top Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G37) | 18500 | 18722.0 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 655.8 | Top Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 1291.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 629.3 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 560.1 | Top Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 4795.5 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 251.3 | Top Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 906.3 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 935.4 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 162.6 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 374.6 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.15 | 10000 | Perfect (G15) | 7500 | 3609.0 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 739.2 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 379.2 | Top Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G29) | 14500 | 9440.4 | Bot Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 123.1 | Top Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 288.5 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 159.5 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 11931.4 | Bot Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 821.5 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 394.4 | Top Clear | 344.83 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2216.0 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 154.5 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 502.4 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2403.1 | Top Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 2209.2 | Bot Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 8757.2 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 432.3 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 149.5 | Bot Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 770.9 | Bot Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1301.0 | Bot Clear | 344.83 |
| Adam-ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 1 | STAGNATED (G19) | 9500 | 4474.9 | Bot Clear | 0.03 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G29) | 14500 | 9882.9 | Bot Clear | 344.83 |
| GA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 132.9 | Bot Clear | 344.83 |
| Natural ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 94.7 | Bot Clear | 344.83 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 619.5 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 145.6 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 5742.2 | Bot Clear | 344.83 |
| Neuro-CMA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 205.7 | Bot Clear | 344.83 |
| CEM | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 1180.5 | Top Clear | 344.83 |
| Diff. Evol. | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 271.1 | Bot Clear | 344.83 |
| PSO | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 135.1 | Bot Clear | 344.83 |
| GA | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 119.0 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2883.5 | Top Clear | 344.83 |
| Adaptive ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 439.3 | Bot Clear | 344.83 |
| CEM | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 643.1 | Top Clear | 344.83 |
| PSO | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 105.4 | Bot Clear | 344.83 |
| Neuro-CMA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 817.3 | Bot Clear | 344.83 |
| Natural ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G23) | 11500 | 4650.6 | Bot Clear | 344.83 |
| GA | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 1911.1 | Bot Clear | 344.83 |
| Diff. Evol. | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 144.6 | Bot Clear | 344.83 |
| Natural ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 98.3 | Top Clear | 344.83 |
| Adam-ES | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1160.5 | Bot Clear | 344.83 |
| Diff. Evol. | Standard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 192.1 | Top Clear | 344.83 |
| Adaptive ES | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 5534.7 | Bot Clear | 344.83 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 120.3 | Bot Clear | 0 |
| Adam-ES | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1927.3 | Top Clear | 344.83 |
| CEM | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 171.2 | Bot Clear | 344.83 |
| PSO | Hard | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 2316.0 | Bot Clear | 344.83 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1438.7 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→3→2→1 | 2 | 5n | 23w | 29p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 380.9 | Bot Clear | 344.83 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 264.2 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 50.5 | Top Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G30) | 1800 | 6009.1 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 1315.4 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 136.0 | Bot Clear | 0 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 710.0 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G26) | 1560 | 3133.3 | Top Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1692.8 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 89.9 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G29) | 1740 | 2044.0 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 410.7 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 621.5 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 1727.7 | Pipe DX | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 2023.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G23) | 1380 | 3305.9 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G31) | 1860 | 2467.2 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 65.1 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 835.8 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 185.5 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 7145.6 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 2415.1 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 106.5 | Top Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 2906.4 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 47.7 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 95.7 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 159.4 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 846.8 | Bird Y | 0 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 538.4 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1785.9 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 625.4 | Top Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 1102.5 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 2081.7 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 4218.5 | Top Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 3592.8 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 634.5 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 835.6 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 755.0 | Top Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 552.5 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 166.8 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 372.1 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G24) | 1440 | 1948.7 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 36.6 | Top Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 41.1 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 3280.5 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 120.3 | Pipe DX | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 114.5 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 642.1 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 46.3 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 1041.5 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 175.1 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 0 | STAGNATED (G30) | 1800 | 1129.2 | Bot Clear | 0 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 731.4 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 2163.7 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G19) | 1140 | 905.2 | Top Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 795.1 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 258.9 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 113.1 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 258.9 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 640.0 | Vel Vy | 0 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 669.1 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 55.7 | Top Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 931.4 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 200.5 | Top Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 1031.2 | Top Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 4424.4 | Top Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 1135.4 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 502.3 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 2577.5 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 113.7 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 258.3 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 4301.6 | Top Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 713.1 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1215.0 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 978.4 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 4869.9 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 64.0 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 125.4 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 904.9 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 414.0 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 1349.7 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 1812.5 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 65.1 | Pipe DX | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 324.2 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 142.2 | Pipe DX | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 501.8 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1286.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G16) | 2400 | 3302.0 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 278.6 | Bot Clear | 0 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 203.0 | Top Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G33) | 4950 | 32749.7 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 2212.5 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 151.1 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 507.7 | Vel Vy | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 333.5 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 207.8 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 876.2 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 49.1 | Top Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G25) | 3750 | 2966.2 | Top Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 82.4 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 2869.2 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 145.7 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 4245.5 | Top Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 256.6 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 340.1 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 72.4 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 1182.6 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1049.7 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 2326.0 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1456.0 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 284.5 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 218.0 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 5274.3 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1638.7 | Top Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 185.6 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 716.7 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1362.7 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 236.5 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 157.5 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 203.7 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 931.2 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 186.1 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 111.3 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 66.3 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 119.2 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 6776.8 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 720.6 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 51.8 | Top Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 171.7 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 156.6 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 364.9 | Top Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1930.8 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 163.2 | Top Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 174.5 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 67.1 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1816.2 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 77.6 | Top Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 244.2 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 663.7 | Top Clear | 0 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1907.0 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 122.7 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1334.8 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 213.1 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1569.6 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1615.1 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 822.3 | Top Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 1188.3 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 72.6 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 180.2 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 93.1 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 3743.5 | Top Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 534.3 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 3117.2 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2418.4 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 174.7 | Top Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 116.4 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G19) | 5700 | 7248.3 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 663.6 | Bird Y | 0 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 728.5 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 12434.2 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 509.8 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 294.5 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 761.7 | Top Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 839.1 | Pipe DX | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 4819.4 | Top Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 9775.8 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 0 | STAGNATED (G27) | 8100 | 8413.7 | Top Clear | 0 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 3310.1 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 874.3 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 98.3 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 130.6 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 313.3 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 178.5 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G22) | 6600 | 2985.9 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 9272.9 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 447.7 | Top Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1837.7 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1260.1 | Top Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G21) | 6300 | 45400.1 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 374.9 | Top Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 12864.4 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 470.2 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 146.5 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 599.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 553.5 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1591.9 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 100.4 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 465.4 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 533.7 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 322.6 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 511.7 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.30 | 10000 | Perfect (G17) | 5100 | 8314.7 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 3176.3 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 582.7 | Pipe DX | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 481.2 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 526.8 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 446.5 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1136.1 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 459.5 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2399.8 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 3256.4 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 859.5 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1615.7 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 476.6 | Pipe DX | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 689.9 | Top Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 86.5 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 996.5 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 2011.7 | Top Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 553.8 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 96.4 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 358.0 | Top Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 205.3 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 8746.2 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 3129.1 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 2583.8 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 26530.8 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 2631.0 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 152.1 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 196.8 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 7470.2 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G22) | 11000 | 42254.4 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1350.6 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1412.8 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 575.8 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 373.1 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 15177.4 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 869.6 | Top Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1595.7 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 892.7 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1428.8 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G27) | 13500 | 60963.0 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 4253.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1780.5 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1788.1 | Top Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1438.8 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 737.0 | Top Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 307.4 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 212.1 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 209.5 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 16957.4 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 308.2 | Top Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 2177.9 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 413.2 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G33) | 16500 | 14881.4 | Bot Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 976.5 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 4518.5 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 292.0 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 2252.9 | Top Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 5122.6 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 4519.4 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 3381.9 | Top Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 183.5 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 240.1 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 227.4 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 453.7 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 772.9 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 2192.1 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 5748.0 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 3541.5 | Bot Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 200.1 | Bot Clear | 232.56 |
| GA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 233.2 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 406.6 | Top Clear | 232.56 |
| Natural ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 1096.8 | Bot Clear | 232.56 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2222.3 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 1676.2 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2215.7 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2002.0 | Bot Clear | 232.56 |
| CEM | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 110.0 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1222.7 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 185.6 | Top Clear | 232.56 |
| Natural ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1261.1 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1062.7 | Top Clear | 232.56 |
| GA | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1299.1 | Bot Clear | 232.56 |
| PSO | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 189.9 | Bot Clear | 232.56 |
| CEM | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 225.0 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1278.3 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 223.7 | Bot Clear | 232.56 |
| PSO | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 597.5 | Bot Clear | 232.56 |
| GA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 716.4 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 623.3 | Top Clear | 232.56 |
| Natural ES | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 364.5 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 113.8 | Top Clear | 0 |
| Adam-ES | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1386.8 | Top Clear | 232.56 |
| CEM | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 192.4 | Top Clear | 232.56 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 0 | STAGNATED (G21) | 1260 | 151.8 | Pipe DX | 0 |
| PSO | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1379.2 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 3880.5 | Top Clear | 232.56 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 43.7 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 429.2 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→6→1 | 1 | 6n | 36w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 502.9 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 625.4 | Top Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 46.4 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 1562.2 | Top Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 275.1 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 1060.0 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1395.9 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 183.8 | Top Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 115.2 | Pipe DX | 0 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 115.2 | Bot Clear | 0 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 0 | STAGNATED (G22) | 1320 | 697.0 | Bird Y | 0 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 80.8 | Top Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G30) | 1800 | 1933.7 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 214.4 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 65.5 | Bot Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 799.5 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 81.1 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 264.8 | Bot Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 5032 | STAGNATED (G46) | 2760 | 17953.0 | Bot Clear | 136 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 101.2 | Bot Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 718.5 | Top Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 79.8 | Pipe DX | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 29.3 | Top Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 0 | STAGNATED (G41) | 2460 | 2854.3 | Bird Y | 0 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 4 | STAGNATED (G22) | 1320 | 744.0 | Top Clear | 0.11 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G34) | 2040 | 1303.0 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 88.5 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 171.3 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G26) | 1560 | 1605.5 | Bot Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 105.7 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 54.7 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 92.9 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 748.3 | Bot Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 2688.9 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 81.7 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 39.2 | Top Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 195.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 165.1 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 77.3 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 66.5 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1271.4 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 313.7 | Bot Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 74.5 | Top Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 623.0 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 374.3 | Top Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 207.0 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 36 | STAGNATED (G28) | 1680 | 925.2 | Top Clear | 0.97 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 265.3 | Top Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 229.4 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 66.5 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 797.4 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G30) | 1800 | 7373.1 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 62.2 | Pipe DX | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 382.5 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 115.8 | Vel Vy | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 135.7 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 1011.6 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 31.8 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 183.5 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 35.6 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 237.1 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 831.0 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 357.2 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 1390.9 | Top Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 771.4 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 874.7 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 573.0 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 2663.5 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 286.2 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 493.5 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 292.1 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 85.2 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 687.0 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 289.6 | Bird Y | 0 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 115.7 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 484.1 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 496.6 | Bot Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 54.6 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 358.7 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 515.3 | Bot Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 225.7 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1730.9 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 288.9 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 3045.8 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G20) | 3000 | 2495.3 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 422.4 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 447.7 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 11651.2 | Bot Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1663.1 | Top Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 99.3 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 39.0 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 139.3 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 317.1 | Pipe DX | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 170.4 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 634.4 | Bot Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 156.7 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 58.5 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1401.3 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 466.8 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 85.2 | Bot Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1322.4 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G35) | 5250 | 3160.3 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 192.1 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 750.7 | Bot Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 134.7 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 224.3 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2102.4 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 1603 | STAGNATED (G23) | 3450 | 2958.2 | Top Clear | 43.32 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G15) | 2250 | 993.6 | Top Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G21) | 3150 | 2898.0 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 3343.2 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 2063.1 | Top Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 804.2 | Pipe DX | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 181.5 | Pipe DX | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 999.1 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 941.8 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 35.7 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 50.8 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 849.1 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 493.7 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 945.4 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 152.1 | Top Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 62.7 | Top Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 1064.7 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 846.1 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 681.9 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 223.7 | Top Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 648.3 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 318.1 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 171.4 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 877.0 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 69.0 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 1942.5 | Top Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 547.2 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 391.1 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 691.5 | Top Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 583.7 | Pipe DX | 0 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 4280.3 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 479.6 | Bird Y | 0 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 136.7 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 392.7 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 102.8 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 1719.8 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 68.9 | Bird Y | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1844.3 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 586.0 | Pipe DX | 0 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G26) | 7800 | 8938.4 | Bot Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 242.3 | Top Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1207.3 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1575.6 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1429.6 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 547.8 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G22) | 6600 | 4050.8 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 5184.9 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 206.6 | Top Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 426.8 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1071.4 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 173.5 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 97.6 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 1029.2 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 198.1 | Bot Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1807.0 | Top Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 420.0 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 230.9 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 4779.0 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 144.9 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 5652.7 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 97.8 | Top Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 0 | STAGNATED (G22) | 6600 | 840.5 | Bot Clear | 0 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 168.0 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 70.7 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 529.0 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 329.2 | Bot Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 0 | STAGNATED (G25) | 7500 | 3137.7 | Top Clear | 0 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 551.8 | Top Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 155.4 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 601.1 | Bot Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 363.3 | Top Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 940.4 | Top Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1389.8 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 153.9 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 768.4 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 863.5 | Vel Vy | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 893.9 | Top Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 446.0 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 1212.3 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 726.8 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 423.8 | Pipe DX | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 468.7 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 127.3 | Top Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 332.1 | Bot Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 146.3 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 681.4 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 96.4 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G29) | 8700 | 7891.4 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 106.2 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 526.5 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 418.3 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 167.7 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 252.4 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1837.0 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G24) | 7200 | 5617.3 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 466.9 | Top Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 154.4 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 4842.5 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 319.2 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 192.8 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 8377.4 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 141.9 | Top Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 113.8 | Vel Vy | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 1442.0 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 892.2 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 315.1 | Bot Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1090.3 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 435.5 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 103.5 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G19) | 9500 | 5264.4 | Top Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 145.1 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1039.4 | Top Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 218.2 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 938.0 | Top Clear | 0 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1265.6 | Bot Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 301.1 | Top Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 15509.5 | Top Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 1429.7 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 200.5 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1228.6 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 601.4 | Top Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 878.3 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G12) | 6000 | 5292.1 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 1695.3 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 128.0 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 4609.5 | Bot Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 279.8 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 2734.3 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 133.6 | Top Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 669.4 | Vel Vy | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 338.5 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 2834.4 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1926.8 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 1628.5 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1412.2 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 131.2 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 697.6 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 102.8 | Bot Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 3862.1 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 999.2 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 577.8 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 8639.8 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 206.3 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 177.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 599.9 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 355.4 | Bot Clear | 270.27 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 2839.4 | Top Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 116.4 | Top Clear | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G12) | 6000 | 3892.1 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 530.8 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 3852.5 | Top Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 535.2 | Bot Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 564.3 | Bot Clear | 270.27 |
| GA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 191.5 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 105.5 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 476.6 | Bot Clear | 270.27 |
| CEM | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 639.5 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 111.1 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1376.9 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2611.5 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 3952.3 | Top Clear | 270.27 |
| PSO | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 197.6 | Bot Clear | 270.27 |
| GA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 271.5 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2997.9 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 996.8 | Pipe DX | 270.27 |
| CEM | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 300.1 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 219.7 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1360.3 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 640.7 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 2287.3 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 1487.7 | Top Clear | 270.27 |
| Natural ES | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 120.1 | Top Clear | 270.27 |
| PSO | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 11312.8 | Bot Clear | 270.27 |
| CEM | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 204.6 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1498.3 | Bot Clear | 270.27 |
| PSO | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 717.2 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 125.2 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 190.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 68.5 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 269.6 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 298.6 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 218.5 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 624.1 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 665.7 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 362.3 | Pipe DX | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 444.8 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 208 | STAGNATED (G63) | 3780 | 10003.7 | Bot Clear | 5.62 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G34) | 2040 | 1314.8 | Bird Y | 0 |
| GA | Hard | 5→4→2→1 | 2 | 6n | 30w | 37p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 5101.8 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 646.3 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 197.8 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 117.2 | Bird Y | 0 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 892.0 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 595.4 | Top Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G40) | 2400 | 2289.5 | Bot Clear | 0 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 624.6 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 105.2 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G12) | 720 | 5695.8 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 662.6 | Top Clear | 0 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 205.9 | Pipe DX | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1615.7 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G38) | 2280 | 4582.7 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 904.9 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 113.1 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 91.3 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1288.4 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 226.8 | Top Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 210.9 | Top Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G30) | 1800 | 1222.4 | Bot Clear | 0 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 213.5 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1909.8 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G27) | 1620 | 1305.1 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 123.1 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 361.9 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 459.2 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 200.0 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 210.9 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 3578.4 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 259.6 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 555.9 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 1917.6 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 55.2 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 0 | STAGNATED (G19) | 1140 | 153.1 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 69.1 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 1108.6 | Top Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 111.1 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 561.8 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 335.0 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 776.6 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 541.8 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 75.6 | Vel Vy | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 567.0 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 16 | STAGNATED (G35) | 2100 | 1206.4 | Bot Clear | 0.43 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 294.0 | Top Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 26.6 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 1144.4 | Top Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G34) | 2040 | 1907.5 | Top Clear | 0 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 77.6 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 62.1 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G21) | 1260 | 751.7 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 182.5 | Top Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 191.4 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 521.3 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 1244.0 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 25.5 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 68.8 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 72.1 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 435.6 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 502.1 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 969.1 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 166.4 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 47.0 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 3766.9 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G35) | 5250 | 7064.9 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G23) | 3450 | 9246.2 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 323.0 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 50.1 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 0 | STAGNATED (G21) | 3150 | 1926.9 | Bird Y | 0 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G19) | 1140 | 1261.8 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 456.6 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G16) | 2400 | 1639.6 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 984.7 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 54.3 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 2566.2 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 292.7 | Vel Vy | 0 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 531.1 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 149.8 | Top Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 55.0 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G33) | 4950 | 3318.8 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 133.0 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G16) | 2400 | 3008.0 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G43) | 6450 | 8695.3 | Top Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 293.8 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 3259.0 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 624.3 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 61.0 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G36) | 5400 | 3253.7 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 267.6 | Pipe DX | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 218.1 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 0 | STAGNATED (G16) | 2400 | 293.0 | Vel Vy | 0 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 215.2 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 0 | STAGNATED (G54) | 8100 | 3231.3 | Top Clear | 0 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 271.3 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 88.4 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1003.7 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 660.8 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 84.8 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 119.0 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 48.7 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 269.0 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 3849.0 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 1159.1 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 201.1 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 947.9 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 4 | STAGNATED (G24) | 3600 | 2173.2 | Bot Clear | 0.11 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 152.5 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 88.5 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 217.3 | Vel Vy | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 104.7 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G35) | 5250 | 7181.2 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 658.1 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 51.4 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 243.3 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 774.1 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1002.1 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 407.1 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 218.7 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 63.3 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 2552.6 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 2137.1 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1120.1 | Top Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 1042.6 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 230.1 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 185.0 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 675.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 341.5 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 263.8 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 584.1 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 151.1 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 939.7 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 663.7 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 41.8 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 78.9 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 796.3 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 157.2 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 536.9 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G16) | 4800 | 1657.5 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 71.9 | Top Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 280.1 | Top Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 317.5 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G11) | 1650 | 2140.8 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 3134.4 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 290.7 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 347.1 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 361.5 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 156.5 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G20) | 6000 | 4578.6 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 928.1 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1915.0 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 3931.2 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 4522.9 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 1191.7 | Top Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1608.2 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 262.9 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 500.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1949.5 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1177.9 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2613.5 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G21) | 6300 | 6333.8 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G36) | 10800 | 6464.4 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 164.4 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3586.0 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 199.6 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 88.3 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 311.8 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 869.8 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 934.8 | Top Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G18) | 5400 | 5668.7 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1637.4 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 100.1 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G27) | 8100 | 5991.7 | Top Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1060.2 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 92.7 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 382.3 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 398.2 | Top Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 1977.9 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 216.8 | Top Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 124.3 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1069.1 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1955.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 101.0 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 156.7 | Pipe DX | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 343.1 | Pipe DX | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G22) | 6600 | 4345.3 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1170.6 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 141.6 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 909.6 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 714.1 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 0 | STAGNATED (G25) | 7500 | 1723.0 | Bot Clear | 0 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 300.7 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G33) | 9900 | 4826.4 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 273.3 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 306.2 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 707.4 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 485.5 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 3253.4 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 109.4 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1336.5 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 139.3 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 101.0 | Top Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 408.2 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 3874.3 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1323.7 | Top Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 174.6 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1783.7 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 519.6 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 986.9 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 768.1 | Bot Clear | 0 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1731.3 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 4912.0 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 867.2 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 3734.0 | Top Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 2966.4 | Top Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 534.5 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G25) | 12500 | 26333.5 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 259.3 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 891.0 | Top Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 553.9 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 974.3 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 5155.8 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 166.3 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 1108.8 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 346.5 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 561.8 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 904.1 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 1107.7 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1359.0 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 424.5 | Top Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 6701.6 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 361.1 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 987.8 | Top Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 225.7 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1540.6 | Top Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 201.6 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 994.7 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 300.3 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G28) | 14000 | 13097.7 | Top Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 127.4 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 216.3 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 3177.2 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 0 | STAGNATED (G16) | 8000 | 1017.8 | Vel Vy | 0 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1101.0 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 148.6 | Bot Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 837.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 727.0 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1335.7 | Top Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 357.3 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 277.0 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 164.5 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 394.6 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 557.1 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1698.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 176.6 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 897.3 | Top Clear | 270.27 |
| Natural ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 137 | STAGNATED (G23) | 11500 | 2096.5 | Bot Clear | 3.7 |
| Diff. Evol. | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 645.2 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 1945.9 | Top Clear | 270.27 |
| PSO | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 207.9 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 338.9 | Bot Clear | 270.27 |
| GA | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 133.4 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1304.9 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1510.3 | Vel Vy | 270.27 |
| Adam-ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 113.5 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 634.1 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 416.6 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 983.5 | Top Clear | 270.27 |
| GA | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 785.5 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 2154.5 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G23) | 11500 | 4886.6 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 93.4 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1493.7 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2963.8 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 107.4 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1466.6 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 4179.9 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 130.6 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→6→1 | 2 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G18) | 9000 | 5755.0 | Top Clear | 270.27 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 183.2 | Bot Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 283.2 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 130.1 | Bird Y | 0 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 97.3 | Top Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 4720.9 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 209.6 | Vel Vy | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 564.2 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 167.9 | Vel Vy | 0 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 381.0 | Top Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 2729.7 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G17) | 1020 | 2820.9 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 288.0 | Top Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 781.3 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1253.1 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 473.8 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 332.9 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 3076.6 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 548.7 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 170.6 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 118.3 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 1 | STAGNATED (G24) | 1440 | 724.1 | Top Clear | 0.02 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G16) | 960 | 1972.2 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 715.3 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 5038.3 | Top Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 67.6 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 976.3 | Top Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 173.7 | Top Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 200.7 | Bot Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 536.3 | Top Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 102.7 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 1126.7 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 2254.8 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 366.6 | Top Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 592.2 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1613.5 | Top Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 160.7 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 98.7 | Top Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 35.8 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 1091.7 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 390.5 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 71.7 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 874.0 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 38.0 | Top Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 229.0 | Top Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 2570.7 | Bot Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 114.8 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 220.5 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1535.0 | Top Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 179.6 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 509.3 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 757 | STAGNATED (G21) | 1260 | 1435.9 | Top Clear | 14.28 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 659.6 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 681.5 | Top Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 53.8 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 110.2 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 38.3 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1997.6 | Top Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 46.8 | Vel Vy | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 61.5 | Top Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 2324.6 | Bot Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G20) | 1200 | 1182.1 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 411.6 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 192.2 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 263.8 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 877.6 | Top Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 2450.4 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 816.2 | Top Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 1761.1 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 190.7 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 757.0 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1274.3 | Bot Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 843.8 | Top Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G18) | 2700 | 4079.5 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 60 | 0.50 | 10000 | Perfect (G25) | 1500 | 1800.9 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 5447.0 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 327.7 | Pipe DX | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1619.2 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 128.9 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1484.7 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 355.7 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 299.0 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 4430.8 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 95.1 | Pipe DX | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 482.1 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 1221.3 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 0 | STAGNATED (G18) | 2700 | 1903.7 | Bot Clear | 0 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 143.0 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 4452.7 | Top Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 4572.4 | Vel Vy | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 2755.4 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 4029.4 | Bot Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G44) | 6600 | 14295.1 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 536.3 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 270.6 | Top Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 325.7 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 459.1 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 742.4 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G34) | 5100 | 7675.2 | Bot Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 259.8 | Top Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 943.4 | Top Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 120.8 | Top Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 385.9 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 1584.8 | Bot Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 770.9 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 275.9 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 522.6 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 82.6 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 263.0 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 1840.8 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 408.0 | Bot Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 239.9 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 780.7 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 589.8 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 719.0 | Top Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 190.9 | Top Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 196.6 | Top Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1300.7 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G32) | 4800 | 8629.7 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 1329 | STAGNATED (G18) | 2700 | 11596.7 | Bot Clear | 25.08 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 456.5 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 78.5 | Bird Y | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 114.4 | Pipe DX | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 308.2 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 772.1 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 133.1 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G20) | 3000 | 962.7 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 69.2 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 980.5 | Top Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 541.5 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 173.9 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 214.1 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 324.7 | Bot Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 1058.0 | Top Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 914.5 | Bot Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 297.5 | Top Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 195.0 | Top Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 2265.4 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 884.8 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 312.9 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 321.0 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 2346.7 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 782.0 | Bird Y | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 186.7 | Bot Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 400.0 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 843.7 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 301.0 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 739.7 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 739.1 | Top Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 1866.4 | Top Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 132.5 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 2898.4 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 127.5 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 3217.0 | Top Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4174.6 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 181.3 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1279.4 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4528.3 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 121.2 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 170.2 | Top Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 510.3 | Top Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 809.7 | Top Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 150 | 0.50 | 10000 | Perfect (G21) | 3150 | 7553.2 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 658.0 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G14) | 4200 | 12841.4 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1349.6 | Top Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 802.9 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 438.2 | Bot Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 2287.4 | Bot Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 533.8 | Top Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 375.3 | Top Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 440.6 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 610.1 | Top Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1342.4 | Top Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1966.6 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 148.9 | Top Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1369.3 | Bot Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 6919.7 | Top Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 316.0 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1480.2 | Top Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 381.2 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 291.1 | Bot Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 802.6 | Bot Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1776.6 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 268.6 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 891.6 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 193.6 | Top Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 5877.7 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 300.1 | Vel Vy | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1158.3 | Top Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1685.4 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 2212.9 | Bot Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2583.6 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 192.0 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G21) | 6300 | 4788.6 | Bot Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 2738.8 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 175.9 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 1246.2 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1447.3 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 334.9 | Vel Vy | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1747.0 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 875.2 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 370.2 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 171.4 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 2076.0 | Bot Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 679 | STAGNATED (G39) | 11700 | 11386.1 | Bot Clear | 12.81 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 441.0 | Top Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 235.9 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 3743.3 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 106.5 | Top Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 944.9 | Top Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 365.8 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 6440.6 | Bot Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1133.6 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 106.3 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 177.3 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1055.3 | Top Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 412.4 | Bot Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 4192.3 | Top Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 208.4 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G23) | 11500 | 16873.9 | Top Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 6213.5 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1996.2 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 490.5 | Top Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 9008.6 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 3043.0 | Top Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 823.3 | Top Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1107.3 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1939.7 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 598.8 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 751.9 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 846.7 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 498.6 | Pipe DX | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 4430.9 | Top Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 6835.4 | Pipe DX | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 473.7 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 4555.1 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 692.2 | Top Clear | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 3240.2 | Bot Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G24) | 12000 | 26343.2 | Top Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1421.0 | Bot Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 1067.1 | Bot Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 5671.0 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 356.2 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1743.1 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 300.4 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2166.6 | Top Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 938.2 | Bot Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 884.5 | Top Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 3065.9 | Bot Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1463.8 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 329.6 | Top Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 292.4 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 245.6 | Bird Y | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1610.2 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1966.0 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 527.4 | Top Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 758.4 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 3944.4 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 185.5 | Bot Clear | 188.68 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 182.6 | Bot Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1025.8 | Bot Clear | 188.68 |
| GA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 728.3 | Top Clear | 188.68 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 5268.2 | Bot Clear | 188.68 |
| Adam-ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 243.3 | Bot Clear | 188.68 |
| Adaptive ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1880.3 | Bot Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 634.4 | Pipe DX | 188.68 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 3006.0 | Top Clear | 188.68 |
| Diff. Evol. | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1821.6 | Bot Clear | 188.68 |
| PSO | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 280.7 | Top Clear | 188.68 |
| Natural ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 3248.2 | Bot Clear | 188.68 |
| CEM | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 483.1 | Top Clear | 188.68 |
| Neuro-CMA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 4256.7 | Bot Clear | 188.68 |
| Adaptive ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1165.7 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 458.2 | Bot Clear | 188.68 |
| GA | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1770.5 | Top Clear | 188.68 |
| CEM | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 1099.2 | Top Clear | 188.68 |
| Natural ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G19) | 9500 | 7413.9 | Bot Clear | 188.68 |
| Diff. Evol. | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 223.9 | Bot Clear | 188.68 |
| Adaptive ES | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1053.6 | Top Clear | 188.68 |
| Natural ES | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 333.9 | Bot Clear | 188.68 |
| GA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 1811.2 | Bot Clear | 188.68 |
| Diff. Evol. | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 201.6 | Bot Clear | 188.68 |
| PSO | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1055.7 | Bot Clear | 188.68 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 1 | STAGNATED (G34) | 2040 | 1637.2 | Top Clear | 0.02 |
| CEM | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 398.0 | Top Clear | 188.68 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 111.5 | Pipe DX | 0 |
| Adam-ES | Standard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 355.7 | Top Clear | 188.68 |
| Neuro-CMA | Easy | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 545.7 | Top Clear | 188.68 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 127.0 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 734.5 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 139.8 | Vel Vy | 0 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 133.5 | Vel Vy | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 126.7 | Top Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 132.2 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 136.2 | Pipe DX | 0 |
| PSO | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 4812.5 | Bot Clear | 188.68 |
| Neuro-CMA | Hard | 5→6→2→1 | 2 | 8n | 44w | 53p | 500 | 0.50 | 10000 | Perfect (G12) | 6000 | 21597.0 | Bot Clear | 188.68 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 147.4 | Top Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 132.8 | Top Clear | 0 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 1405.7 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 81.7 | Top Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 156.9 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G21) | 1260 | 896.6 | Bot Clear | 0 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 0 | STAGNATED (G30) | 1800 | 1096.3 | Bird Y | 0 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 634.3 | Top Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 2533.1 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 746.3 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 0 | STAGNATED (G30) | 1800 | 1292.2 | Bird Y | 0 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 7629.1 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 2517.2 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1574.3 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 244.1 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 34.5 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 44.6 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 721.0 | Top Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 902.5 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G16) | 960 | 4347.8 | Bot Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 940.8 | Bot Clear | 0 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 413.1 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 3098.7 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 29.3 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 326.0 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G52) | 3120 | 2825.4 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 2010.0 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 96.7 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 1199.9 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 33.2 | Top Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 1209.6 | Bot Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 2 | STAGNATED (G19) | 1140 | 497.7 | Top Clear | 0.05 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 171.6 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 3577.2 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 1040.8 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 42.8 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 2543.0 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 140.5 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 71.2 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 371.1 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.30 | 10000 | Perfect (G15) | 900 | 1324.4 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 1097.8 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 377.6 | Top Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 54.0 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 590.7 | Top Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 135.8 | Top Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 531.7 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G21) | 1260 | 700.8 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 137.3 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 0 | STAGNATED (G16) | 960 | 162.7 | Pipe DX | 0 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 388.9 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 241.2 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G20) | 1200 | 1629.5 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 1432.3 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 218.1 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G22) | 1320 | 273.0 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 715.5 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 1190.3 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 1488.6 | Bot Clear | 0 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 1738.3 | Top Clear | 0 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 318.6 | Vel Vy | 0 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 77.1 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 539.8 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 132.8 | Top Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 243.6 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 815.4 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 334.9 | Vel Vy | 0 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 3270.8 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 2813.7 | Top Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 644.4 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 295.3 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 871.2 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 744.9 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 337.5 | Top Clear | 0 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1591.0 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1406.8 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 138.9 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 1380.9 | Top Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 2550.2 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 564.7 | Top Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 503.4 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 499.4 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 1513.8 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 3115.8 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 95.8 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 204.4 | Top Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 1062.1 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G16) | 2400 | 2010.8 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 192.0 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 875.8 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.15 | 10000 | Perfect (G11) | 1650 | 1189.5 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 264.6 | Bot Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 56.8 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 1707.7 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G20) | 3000 | 866.5 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G19) | 2850 | 2103.0 | Top Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1196.9 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 860.6 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 93.6 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 547.9 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G13) | 1950 | 1999.0 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 0 | STAGNATED (G26) | 3900 | 1618.5 | Top Clear | 0 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G24) | 3600 | 5301.8 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 972.2 | Top Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 45.0 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G15) | 2250 | 1976.2 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 319.5 | Bot Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 279.1 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2346.9 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 299.6 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 150.9 | Top Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 300.8 | Bird Y | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 331.2 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 128.6 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 49 | STAGNATED (G30) | 4500 | 872.3 | Top Clear | 1.14 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 226.4 | Top Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1385.2 | Pipe DX | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 183.5 | Vel Vy | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1232.4 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 413.4 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G17) | 2550 | 1158.7 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 345.6 | Bot Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 1715.2 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 72.4 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 502.2 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1723.3 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 1369.1 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 82.0 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G16) | 2400 | 1957.7 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 405.3 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 678.8 | Bot Clear | 0 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1399.2 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G18) | 2700 | 1971.6 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 222.6 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 773.5 | Pipe DX | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 576.4 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 1152.6 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 1564.2 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 505.9 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 1531.2 | Bot Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3228.2 | Top Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 879.5 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1550.6 | Top Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G18) | 5400 | 9886.2 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 68.0 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 678.8 | Bird Y | 0 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 675.2 | Bot Clear | 0 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1023.2 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G17) | 5100 | 5196.8 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1524.0 | Bot Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1086.3 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 297.0 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 1580.7 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 426.3 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 1194.5 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 386.3 | Vel Vy | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 241.5 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 359.2 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1166.4 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 90.1 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 108.3 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 856.0 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 357.4 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G31) | 9300 | 9295.2 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 469.8 | Top Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 305.0 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 621.9 | Bot Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 85.3 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 5001.3 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 296.2 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1156.0 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 289.1 | Top Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2150.3 | Top Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 719.8 | Top Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G16) | 4800 | 4394.2 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1739.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 2354.6 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 870.7 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 294.8 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1591.8 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1015.0 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 577.0 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 641.3 | Bot Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 386.2 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 1158.7 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 882.1 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 574.6 | Top Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1726.2 | Bot Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 118.8 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 764.2 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 937.5 | Top Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 1476.8 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 79.9 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 689.9 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G22) | 6600 | 3892.0 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 6596.8 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 575.9 | Top Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 231.3 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 1740.9 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 941.7 | Top Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 5053.2 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 239.6 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 208.0 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1117.8 | Pipe DX | 0 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1117.3 | Vel Vy | 0 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 344.3 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 465.3 | Pipe DX | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 229.3 | Top Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 162.5 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 618.6 | Top Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 0 | STAGNATED (G21) | 10500 | 1459.8 | Vel Vy | 0 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 134.2 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 288.0 | Bot Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 2441.8 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 605.8 | Top Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 552.9 | Top Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1012.7 | Top Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 4741.6 | Bot Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 3671.9 | Top Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 130.7 | Top Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 173.5 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 0 | STAGNATED (G25) | 12500 | 9297.6 | Vel Vy | 0 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3378.9 | Top Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1333.7 | Bot Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 300 | 0.50 | 10000 | Perfect (G16) | 4800 | 22706.7 | Top Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 162.6 | Top Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 315.9 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 3252.3 | Bot Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 295.7 | Bot Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 346.0 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 155.6 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 32 | STAGNATED (G25) | 12500 | 11132.9 | Bot Clear | 0.74 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 501.9 | Bot Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 764.8 | Bot Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G19) | 9500 | 9267.4 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1516.8 | Top Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 162.4 | Top Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 6650.2 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 669.1 | Bot Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 129.2 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 485.7 | Bot Clear | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G30) | 15000 | 7508.7 | Bot Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1496.3 | Bot Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 349.4 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 466.9 | Bot Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 4424.1 | Bot Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1427.6 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 300.9 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 4598.7 | Bot Clear | 232.56 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 318.9 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 325.7 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 1006.6 | Vel Vy | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 642.9 | Bot Clear | 232.56 |
| GA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 622.0 | Top Clear | 232.56 |
| Adam-ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 110.1 | Top Clear | 232.56 |
| Adaptive ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 380.4 | Top Clear | 232.56 |
| Natural ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 392.1 | Top Clear | 232.56 |
| CEM | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1875.1 | Bot Clear | 232.56 |
| Neuro-CMA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 458.2 | Bot Clear | 232.56 |
| PSO | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 198.7 | Bot Clear | 232.56 |
| Diff. Evol. | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 2090.7 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 2734.0 | Top Clear | 232.56 |
| GA | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 130.0 | Bot Clear | 232.56 |
| Adam-ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 365.7 | Vel Vy | 232.56 |
| Natural ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G16) | 8000 | 2222.8 | Bot Clear | 232.56 |
| Neuro-CMA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 870.6 | Top Clear | 232.56 |
| CEM | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 2980.3 | Top Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.30 | 10000 | Perfect (G17) | 8500 | 17370.7 | Top Clear | 232.56 |
| PSO | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2043.4 | Bot Clear | 232.56 |
| GA | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G9) | 4500 | 2442.0 | Bot Clear | 232.56 |
| Diff. Evol. | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1663.3 | Bot Clear | 232.56 |
| Adam-ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 141.0 | Top Clear | 232.56 |
| Adaptive ES | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1066.4 | Top Clear | 232.56 |
| Adaptive ES | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1150.6 | Bot Clear | 232.56 |
| Natural ES | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 125.3 | Top Clear | 232.56 |
| PSO | Hard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 875.3 | Bot Clear | 232.56 |
| Diff. Evol. | Standard | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 658.1 | Bot Clear | 232.56 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 91.5 | Bot Clear | 270.27 |
| CEM | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 477.8 | Top Clear | 232.56 |
| Neuro-CMA | Easy | 5→4→2→2→1 | 3 | 8n | 34w | 43p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2075.6 | Top Clear | 232.56 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 1325.8 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 116.7 | Vel Vy | 0 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G17) | 1020 | 122.7 | Top Clear | 0 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G46) | 2760 | 4597.2 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G25) | 1500 | 791.3 | Bot Clear | 0 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 1810.3 | Top Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 194.2 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 38.2 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 126.0 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 113.7 | Top Clear | 0 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 652.6 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G43) | 2580 | 1985.5 | Bot Clear | 0 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 506.7 | Top Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G32) | 1920 | 774.2 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 44.8 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G20) | 1200 | 863.3 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 86.4 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 1997.0 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 111.3 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 0 | STAGNATED (G27) | 1620 | 4092.9 | Pipe DX | 0 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G17) | 1020 | 370.7 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 68.8 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 45.6 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G23) | 1380 | 1232.7 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 110.2 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 115.3 | Bot Clear | 0 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G30) | 1800 | 2775.7 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G16) | 960 | 118.3 | Bot Clear | 0 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 602.9 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G26) | 1560 | 1302.5 | Bird Y | 0 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 79.1 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 0 | STAGNATED (G17) | 1020 | 294.5 | Top Clear | 0 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 320.8 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 301.8 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 1768.3 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 1012.1 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 38.5 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 69.1 | Top Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1240.0 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G14) | 840 | 449.5 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 683.4 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1490.8 | Top Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 55.4 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 219.1 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 114.5 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 0 | STAGNATED (G25) | 1500 | 1259.6 | Pipe DX | 0 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 496.7 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 136.9 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 177.6 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 101.3 | Bird Y | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 547.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 111.8 | Pipe DX | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 48.6 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 823.2 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 799.5 | Top Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 1 | STAGNATED (G22) | 1320 | 733.1 | Vel Vy | 0.03 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 84.4 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 27.9 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 1204.3 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 67.7 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G15) | 900 | 244.3 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 187.2 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 990.7 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 36.5 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G19) | 1140 | 567.4 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 617.2 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 128.0 | Top Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 71.5 | Top Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 82.1 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G19) | 1140 | 865.8 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 630.5 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G19) | 2850 | 2293.0 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 119.9 | Bot Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 49.8 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G32) | 4800 | 4987.4 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 615.5 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2251.2 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 166.3 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 420.2 | Vel Vy | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 2026.3 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1444.7 | Bird Y | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G23) | 3450 | 4009.7 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 4473.5 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G28) | 4200 | 4524.3 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 409.3 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 149.9 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 631.0 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 283.1 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 686.0 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 411.1 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 252.4 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 150.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G19) | 2850 | 5530.3 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 185.2 | Bot Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 156.9 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 419.6 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1017.0 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 327.6 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G19) | 2850 | 727.3 | Top Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 0 | STAGNATED (G17) | 2550 | 317.3 | Top Clear | 0 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 778.2 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 47.3 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 318.7 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 270.1 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 785.0 | Top Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 53.0 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 249.7 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 155.6 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 45.8 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 0 | STAGNATED (G49) | 7350 | 6202.4 | Bot Clear | 0 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 227.2 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 739.7 | Top Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 864.1 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 0 | STAGNATED (G16) | 2400 | 583.9 | Pipe DX | 0 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 125.3 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 230.7 | Vel Vy | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 196.8 | Bot Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 93.5 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 124.6 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 437.4 | Top Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1993.0 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 0 | STAGNATED (G22) | 3300 | 443.0 | Bot Clear | 0 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10 | STAGNATED (G35) | 5250 | 1035.1 | Bot Clear | 0.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 140.7 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 604.0 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 738.0 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 1504.4 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 685.4 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 51.7 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G25) | 3750 | 3509.8 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G38) | 5700 | 4950.4 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 191 | STAGNATED (G30) | 4500 | 1018.4 | Bird Y | 5.16 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1403.9 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 669.3 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1197.6 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 334.1 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 141.3 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G17) | 5100 | 622.1 | Vel Vy | 0 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 449.2 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 582.3 | Top Clear | 0 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 721.4 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G24) | 3600 | 3878.1 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 462.3 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 111.5 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 3626.0 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1969.9 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 352.4 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 1006.0 | Bot Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 321.9 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1015.7 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 997.2 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G35) | 10500 | 6301.3 | Bot Clear | 0 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 718.4 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 577.0 | Pipe DX | 0 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 121.2 | Pipe DX | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1610.5 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 113.4 | Top Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 274.7 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 0 | STAGNATED (G19) | 5700 | 3921.1 | Bird Y | 0 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 52.3 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 3101.3 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 79.8 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 0 | STAGNATED (G16) | 4800 | 593.0 | Top Clear | 0 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1379.1 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 7033.2 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 224.3 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G14) | 4200 | 537.4 | Top Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 1597.2 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 490.3 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 159.7 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 189.5 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 333.3 | Top Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 768.2 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 119.2 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 0 | STAGNATED (G19) | 5700 | 3357.8 | Bird Y | 0 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G12) | 3600 | 916.3 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 801.8 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 164.4 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 287.2 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 698.4 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 4482.0 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2923.0 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 673.0 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 505.3 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 593.9 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 0 | STAGNATED (G16) | 4800 | 697.9 | Bot Clear | 0 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1119.1 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 70.2 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 778.9 | Pipe DX | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 7117.0 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1069.0 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1438.2 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 827.0 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 459.1 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 98.5 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10 | STAGNATED (G23) | 6900 | 1172.0 | Bot Clear | 0.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 598.1 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1036.3 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 634.4 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 344.3 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 369.2 | Bot Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 531.2 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 748.6 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 279.0 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 611.7 | Top Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 508.0 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 3632.9 | Bot Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 74.0 | Top Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 120.7 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 279.6 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 200.8 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G10) | 3000 | 1848.0 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 169.1 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 3209.0 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 0 | STAGNATED (G21) | 10500 | 1264.0 | Bot Clear | 0 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 1294.5 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 215.0 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 5622.5 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 339.4 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 112.7 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 3 | STAGNATED (G19) | 9500 | 6282.8 | Top Clear | 0.08 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 1 | STAGNATED (G43) | 21500 | 2631.7 | Bot Clear | 0.03 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 930.1 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 387.0 | Pipe DX | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 3341.7 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 704.7 | Top Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1453.4 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 1335.1 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1083.5 | Top Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 0 | STAGNATED (G19) | 9500 | 5482.9 | Bird Y | 0 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 515.8 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G27) | 13500 | 34487.2 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 5319.2 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 117.3 | Bot Clear | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 395.9 | Bot Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 604.4 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G14) | 7000 | 7572.5 | Top Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G17) | 8500 | 2344.9 | Top Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 405.6 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 142.5 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G11) | 5500 | 1062.6 | Top Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 480.4 | Top Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1607.8 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 671.4 | Bot Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1662.9 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 165.3 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 0 | STAGNATED (G18) | 9000 | 1128.7 | Top Clear | 0 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 569.4 | Bot Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 3329.5 | Top Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1594.8 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 211.3 | Bot Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1772.0 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 846.2 | Top Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G22) | 11000 | 6136.6 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 569.4 | Top Clear | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 367.4 | Bot Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 527.9 | Top Clear | 270.27 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 322.9 | Top Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 132.1 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2003.9 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 202.9 | Bot Clear | 270.27 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 432.5 | Pipe DX | 270.27 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 4081.1 | Top Clear | 270.27 |
| Adam-ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1056.3 | Top Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1644.8 | Bot Clear | 270.27 |
| Adaptive ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 459.5 | Bot Clear | 270.27 |
| GA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2081.3 | Top Clear | 270.27 |
| PSO | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 620.4 | Top Clear | 270.27 |
| Neuro-CMA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 92.6 | Bot Clear | 270.27 |
| GA | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 113.4 | Bot Clear | 270.27 |
| Natural ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G20) | 10000 | 2930.1 | Bot Clear | 270.27 |
| Diff. Evol. | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 2432.5 | Top Clear | 270.27 |
| Adam-ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 1056.1 | Pipe DX | 270.27 |
| Diff. Evol. | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 176.1 | Bot Clear | 270.27 |
| CEM | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 2844.4 | Bot Clear | 270.27 |
| CEM | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G22) | 11000 | 5344.0 | Bot Clear | 270.27 |
| Adaptive ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 133.1 | Bot Clear | 270.27 |
| Neuro-CMA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1247.6 | Top Clear | 270.27 |
| PSO | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 2898.2 | Bot Clear | 270.27 |
| GA | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 371.2 | Bot Clear | 270.27 |
| Natural ES | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 98.7 | Top Clear | 270.27 |
| Adam-ES | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 441.0 | Bot Clear | 270.27 |
| Adaptive ES | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 780.6 | Top Clear | 270.27 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 85.5 | Top Clear | 0 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G37) | 2220 | 1321.9 | Bird Y | 0 |
| PSO | Hard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 297.9 | Bot Clear | 270.27 |
| CEM | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 884.1 | Top Clear | 270.27 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 839.4 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 127.1 | Bot Clear | 270.27 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 229.5 | Top Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→4→2→1 | 3 | 8n | 28w | 37p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1916.2 | Top Clear | 270.27 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 232.0 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G23) | 1380 | 498.1 | Bird Y | 0 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1500.8 | Top Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G48) | 2880 | 1020.6 | Top Clear | 0 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 248.9 | Bot Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 675.8 | Bot Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 102.8 | Bot Clear | 0 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G21) | 1260 | 137.9 | Bird Y | 0 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G10) | 600 | 1067.2 | Top Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 246.6 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G29) | 1740 | 2860.2 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 0 | STAGNATED (G29) | 1740 | 734.9 | Bird Y | 0 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 295.0 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 158.3 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 200.2 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 564.2 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 1883.9 | Top Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G1) | 60 | 135.2 | Top Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 124.6 | Pipe DX | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G29) | 1740 | 1405.7 | Top Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 55.2 | Bot Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G41) | 2460 | 1424.6 | Top Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 118.0 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G24) | 1440 | 3096.2 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 682.8 | Bot Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 0 | STAGNATED (G29) | 1740 | 1033.1 | Bird Y | 0 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 327.5 | Top Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 162.8 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 734.8 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 967.2 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G18) | 1080 | 2748.1 | Top Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 58.7 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 123.6 | Bot Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 170.5 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 375.9 | Bot Clear | 0 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 359.7 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 160.3 | Top Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 3199 | STAGNATED (G28) | 1680 | 884.7 | Top Clear | 96.94 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 241.5 | Top Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 202.1 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G12) | 720 | 791.6 | Bot Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 0 | STAGNATED (G24) | 1440 | 167.0 | Bot Clear | 0 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 957.3 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 315.5 | Top Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 128.3 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 183.9 | Bot Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 0 | STAGNATED (G17) | 1020 | 116.8 | Bot Clear | 0 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 620.8 | Top Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.30 | 10000 | Perfect (G9) | 540 | 1264.1 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 20.0 | Bot Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 1208.1 | Bot Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 19.9 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 82.7 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 0 | STAGNATED (G16) | 960 | 273.0 | Top Clear | 0 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 106.5 | Top Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G23) | 1380 | 1457.1 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 782.6 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 37.1 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 553.3 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 281.3 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 785.1 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 742.1 | Top Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 257.3 | Bird Y | 0 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G29) | 1740 | 822.4 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 56.9 | Bot Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G48) | 2880 | 367.2 | Top Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 227.0 | Bot Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 988.6 | Bot Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 141.0 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 349.7 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 188.1 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 2257.5 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 260.5 | Bird Y | 0 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G39) | 5850 | 11057.0 | Top Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 128.9 | Top Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 61.8 | Bot Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1083.8 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 47.0 | Bot Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G38) | 5700 | 3902.8 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 555.5 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 0 | STAGNATED (G23) | 3450 | 991.5 | Bird Y | 0 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 97.3 | Top Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G30) | 4500 | 2932.7 | Top Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 130.9 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 451.3 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 577.6 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 3 | STAGNATED (G21) | 3150 | 368.4 | Bot Clear | 0.09 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 0 | STAGNATED (G20) | 3000 | 319.2 | Top Clear | 0 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 199.0 | Top Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 884.3 | Bot Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 100.9 | Bot Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 78.0 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 1391.0 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 993.7 | Top Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 301.4 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 141.1 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G9) | 1350 | 977.0 | Bot Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 5499.0 | Bot Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 585.5 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 782.8 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.15 | 10000 | Perfect (G35) | 5250 | 22230.9 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G21) | 3150 | 406.2 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 363.9 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 0 | STAGNATED (G20) | 3000 | 339.7 | Bot Clear | 0 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 811.9 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 522.7 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 405.8 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 1251.4 | Bot Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 74.0 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 307.8 | Top Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 36.5 | Pipe DX | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 187.3 | Top Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 78.7 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 32.9 | Top Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 5452.7 | Top Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 104.7 | Top Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 29.5 | Bot Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 320.6 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 353.9 | Bot Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 259.2 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 0 | STAGNATED (G16) | 2400 | 325.9 | Bird Y | 0 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 4 | STAGNATED (G16) | 2400 | 294.8 | Pipe DX | 0.12 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 175.1 | Top Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 2110.7 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 125.6 | Bot Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 2064.9 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 271.3 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G13) | 1950 | 2682.7 | Bot Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 727.6 | Top Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1082.6 | Bot Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1004.1 | Bot Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G48) | 7200 | 27192.5 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 136.4 | Bot Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 351.1 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 145.4 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 0 | STAGNATED (G25) | 7500 | 1107.0 | Bird Y | 0 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G20) | 3000 | 503.5 | Top Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 31.9 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 819.3 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 1278 | STAGNATED (G21) | 3150 | 3651.4 | Bot Clear | 38.73 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 236.9 | Bot Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G37) | 11100 | 8737.1 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 380.9 | Top Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 385.9 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 4456.4 | Top Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 520.8 | Vel Vy | 0 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 1715.9 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 150 | 0.50 | 10000 | Perfect (G14) | 2100 | 5515.0 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1608.5 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 494.1 | Bird Y | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1004.5 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 427.3 | Pipe DX | 0 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 57.5 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 283.9 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G41) | 12300 | 8282.0 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2497.2 | Top Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1601.1 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 771.7 | Top Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 51.0 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 682.8 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 215.2 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 1041.7 | Bot Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 262.0 | Bot Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 143.1 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.15 | 10000 | Perfect (G16) | 4800 | 3240.3 | Top Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 463.7 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 232.5 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 231.0 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G21) | 6300 | 2644.3 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 159.6 | Bot Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 2519.3 | Top Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 2207.2 | Bot Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G38) | 11400 | 2924.7 | Bot Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 2147.6 | Top Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 117.4 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G11) | 3300 | 819.7 | Top Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 485.8 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 256.7 | Pipe DX | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 1066.0 | Bot Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G32) | 9600 | 6762.0 | Top Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 1545.4 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 0 | STAGNATED (G26) | 7800 | 3666.2 | Bot Clear | 0 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 0 | STAGNATED (G27) | 8100 | 996.0 | Bot Clear | 0 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 0 | STAGNATED (G18) | 5400 | 600.1 | Top Clear | 0 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 501.3 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 264.9 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 597.4 | Top Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 581.2 | Bot Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 502.1 | Pipe DX | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 111.0 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 342.8 | Bot Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 0 | STAGNATED (G34) | 10200 | 4006.7 | Top Clear | 0 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 544.1 | Top Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 91.0 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 280.6 | Top Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 6491.7 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 59.2 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 62.6 | Top Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G18) | 5400 | 1533.6 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 0 | STAGNATED (G16) | 4800 | 551.2 | Bird Y | 0 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 403.0 | Top Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 395.8 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 752.3 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 290.8 | Bot Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G9) | 2700 | 624.8 | Bot Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 2258.7 | Top Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 1221.9 | Top Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 77.5 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 798.0 | Vel Vy | 0 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 6 | STAGNATED (G25) | 12500 | 5999.1 | Top Clear | 0.18 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 105.5 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 1116.8 | Top Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 97.1 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 4384.8 | Bot Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 236.9 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 271.7 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 767.5 | Bot Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G19) | 9500 | 2369.7 | Top Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 5977.5 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 552.6 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G20) | 10000 | 7584.1 | Bot Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 2340.3 | Bot Clear | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 0 | STAGNATED (G27) | 13500 | 1463.2 | Top Clear | 0 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 86.4 | Top Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 925.5 | Bot Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G31) | 15500 | 7790.7 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 606.4 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 884.5 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2625.9 | Bot Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1534.8 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 0 | STAGNATED (G16) | 8000 | 882.7 | Vel Vy | 0 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1061.1 | Top Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 272.7 | Top Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 140.0 | Top Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 262.7 | Top Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 102.3 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G19) | 9500 | 11775.3 | Top Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.15 | 10000 | Perfect (G21) | 10500 | 33603.6 | Top Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 2751.6 | Top Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1170.3 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 143.2 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 350.0 | Top Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 185.7 | Top Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 457.0 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 4543.1 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 345.7 | Top Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 156.0 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 233.7 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 113.2 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1451.6 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G24) | 12000 | 8030.1 | Bot Clear | 303.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 1043.1 | Top Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 380.2 | Top Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G15) | 7500 | 1019.8 | Bot Clear | 303.03 |
| Natural ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 0 | STAGNATED (G18) | 9000 | 1216.6 | Bird Y | 0 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G16) | 8000 | 1460.2 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 1532.0 | Top Clear | 303.03 |
| Adam-ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 0 | STAGNATED (G19) | 9500 | 1077.9 | Pipe DX | 0 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 996.8 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 333.2 | Bot Clear | 303.03 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1213.7 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1090.0 | Top Clear | 303.03 |
| CEM | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 363.3 | Top Clear | 303.03 |
| Diff. Evol. | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1046.1 | Bot Clear | 303.03 |
| Adaptive ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1642.7 | Top Clear | 303.03 |
| GA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 264.5 | Bot Clear | 303.03 |
| PSO | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 99.7 | Top Clear | 303.03 |
| Neuro-CMA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 156.9 | Top Clear | 303.03 |
| Natural ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 1 | STAGNATED (G30) | 15000 | 5944.1 | Bot Clear | 0.03 |
| CEM | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 960.3 | Bot Clear | 303.03 |
| Adaptive ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 182.4 | Bot Clear | 303.03 |
| Adam-ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 1166.5 | Bot Clear | 303.03 |
| Diff. Evol. | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 113.6 | Top Clear | 303.03 |
| Neuro-CMA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 922.2 | Bot Clear | 303.03 |
| GA | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 970.3 | Bot Clear | 303.03 |
| GA | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 845.0 | Bot Clear | 303.03 |
| PSO | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 3017.2 | Top Clear | 303.03 |
| Adaptive ES | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 607.2 | Pipe DX | 303.03 |
| Natural ES | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 152.8 | Bot Clear | 303.03 |
| CEM | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 210.0 | Top Clear | 303.03 |
| PSO | Hard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 511.8 | Bot Clear | 303.03 |
| Adam-ES | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 978.7 | Bot Clear | 303.03 |
| Diff. Evol. | Standard | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 764.2 | Bot Clear | 303.03 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 1 | STAGNATED (G22) | 1320 | 1643.5 | Top Clear | 0.02 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 134.2 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 179.9 | Top Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 544.5 | Vel Vy | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 175.9 | Bot Clear | 0 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 893.1 | Vel Vy | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 0 | STAGNATED (G20) | 1200 | 219.5 | Vel Vy | 0 |
| Neuro-CMA | Easy | 5→2→2→2→2→1 | 4 | 8n | 24w | 33p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 742.8 | Bot Clear | 303.03 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 121.9 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 179.2 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 872.3 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 1892.1 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 135.6 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 170.4 | Bird Y | 0 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G11) | 660 | 1249.7 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 881.8 | Bot Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 0 | STAGNATED (G28) | 1680 | 1300.0 | Bird Y | 0 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G22) | 1320 | 1556.2 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 1440.9 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 356.5 | Top Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 174.8 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 7 | STAGNATED (G43) | 2580 | 4152.5 | Bot Clear | 0.12 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 681.9 | Vel Vy | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 128.5 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 9348.2 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 354.4 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 99.3 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 894.4 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 975.3 | Top Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 2179.7 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G23) | 1380 | 2450.0 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 0 | STAGNATED (G44) | 2640 | 2598.2 | Vel Vy | 0 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 860.4 | Bot Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 176.5 | Bot Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 63.1 | Pipe DX | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 1023.0 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G25) | 1500 | 3212.3 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1514.1 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 0 | STAGNATED (G22) | 1320 | 1006.0 | Bird Y | 0 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 530.2 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 925.3 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 42.1 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 213.9 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G27) | 1620 | 3993.0 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 1 | STAGNATED (G19) | 1140 | 369.4 | Top Clear | 0.02 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G11) | 660 | 485.7 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 903.8 | Pipe DX | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 1387.0 | Top Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G17) | 1020 | 510.8 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1082.0 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.30 | 10000 | Perfect (G34) | 2040 | 4862.6 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 1295.5 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 858.0 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 182 | STAGNATED (G21) | 1260 | 428.7 | Bot Clear | 3.19 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 45.3 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G1) | 60 | 52.7 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 1044.7 | Bot Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 1494.6 | Bot Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G16) | 960 | 1087.2 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 1533.8 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 0 | STAGNATED (G25) | 1500 | 348.2 | Top Clear | 0 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G6) | 360 | 551.3 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 132.6 | Top Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 175.7 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 237.3 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 826.8 | Top Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 854.1 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G22) | 1320 | 3618.7 | Bot Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 2011.0 | Top Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 385.8 | Top Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 64.2 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 1992.8 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 218.2 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 3474.1 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1183.2 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 504.9 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 0 | STAGNATED (G17) | 2550 | 473.2 | Pipe DX | 0 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 438.8 | Top Clear | 0 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 407.5 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 194.3 | Bot Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 436.8 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 2379.2 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 6487.8 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G27) | 4050 | 8641.4 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 366.8 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 507.9 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 711.7 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 7208.6 | Top Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 233.3 | Top Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 7845.9 | Top Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 197.8 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 80.7 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 649.0 | Top Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 270.7 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 371.7 | Top Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 61.6 | Top Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1660.7 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 2009.2 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 215.3 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.15 | 10000 | Perfect (G32) | 4800 | 27506.0 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 365.9 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G38) | 5700 | 5719.6 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 150.6 | Bot Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 66.3 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 215.2 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G12) | 1800 | 1427.5 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2329.7 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 205.8 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 2621.8 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 310.6 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 577.8 | Top Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G6) | 900 | 469.6 | Top Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1298.4 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 217.2 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G21) | 3150 | 5808.8 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 125.0 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 197.4 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 676.0 | Pipe DX | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 99.2 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2637.6 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 87.9 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 489.8 | Top Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1444.5 | Top Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 434.2 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 180.5 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 575.9 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 140.8 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1180.6 | Top Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 149.1 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 924.8 | Bot Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 70.2 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 183.6 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 523.2 | Top Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 437.1 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1467.4 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 100.3 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 949.8 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 95.9 | Top Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 64.6 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 62.3 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 192.1 | Bot Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 5914 | STAGNATED (G21) | 3150 | 8272.4 | Top Clear | 103.75 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 115.7 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 4 | STAGNATED (G30) | 9000 | 10473.2 | Top Clear | 0.07 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G17) | 2550 | 2231.9 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1657.1 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 2108.5 | Top Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1092.8 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 1949.5 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 930.6 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 598.4 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 2013.6 | Bot Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 6220.9 | Top Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G21) | 6300 | 17904.4 | Top Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1295.6 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G13) | 3900 | 1864.2 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 124.2 | Bot Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 1845.2 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1684.2 | Top Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G31) | 9300 | 10035.2 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 0 | STAGNATED (G30) | 9000 | 6961.1 | Bot Clear | 0 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 2878.7 | Bot Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 975.3 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1242.3 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 4625.7 | Top Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 531.4 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 793.3 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1709.2 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 313.3 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 289.8 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 2432.8 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 946.7 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 138.2 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 241.9 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 209.3 | Bot Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1070.3 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 262.2 | Top Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G21) | 6300 | 7199.6 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 166.0 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 1315 | STAGNATED (G20) | 6000 | 6120.5 | Bot Clear | 23.07 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 2255.5 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 413.6 | Top Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 180.6 | Bot Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 444.4 | Top Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 1250.5 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 592.3 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 290.1 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 842.1 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 162.9 | Vel Vy | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 1263.8 | Top Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 698.9 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 1264.6 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3480.4 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 216.3 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 968.1 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 1254.1 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 819.7 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 135.8 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 483.7 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 6543.1 | Bot Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 761.8 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 678.2 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 155.2 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 408.9 | Top Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 504.3 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 290.3 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 822.8 | Bot Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 886.4 | Bot Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 104.8 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 105.1 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 1851.1 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 154.4 | Bot Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 822.8 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 4293.5 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 2172.6 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 236.7 | Top Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 524.6 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 1118.5 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1232.6 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 275.0 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G20) | 10000 | 14231.4 | Top Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 261.9 | Bot Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 961.9 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 948.9 | Top Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 790.8 | Pipe DX | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 300 | 0.30 | 10000 | Perfect (G17) | 5100 | 8803.3 | Bot Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1101.5 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 1486.2 | Bird Y | 0 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 5706.1 | Top Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 4863.9 | Top Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 4419.3 | Top Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 623.4 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 263.1 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1347.0 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G13) | 6500 | 2646.5 | Top Clear | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 4147.9 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 144.2 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 3928.2 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 2409.2 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1377.7 | Bot Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 580.7 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 210.5 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1298.8 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 752.2 | Bot Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2066.2 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 517.5 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1392.7 | Top Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G24) | 12000 | 17416.5 | Bot Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1443.6 | Top Clear | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 2637.1 | Bot Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 446.9 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G23) | 11500 | 10033.5 | Bot Clear | 175.44 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1670.8 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 526.7 | Vel Vy | 175.44 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 1830.0 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 218.7 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 2511.9 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 321.4 | Bot Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 709.4 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 1319.7 | Top Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 694.5 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1429.2 | Top Clear | 175.44 |
| Natural ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 346.4 | Bot Clear | 175.44 |
| GA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 195.5 | Bot Clear | 175.44 |
| Adam-ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 2135.2 | Top Clear | 175.44 |
| Adaptive ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 697.1 | Top Clear | 175.44 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 11322.2 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 6135.5 | Bot Clear | 175.44 |
| Diff. Evol. | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 970.6 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 5699.6 | Bot Clear | 175.44 |
| CEM | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 797.1 | Top Clear | 175.44 |
| PSO | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 241.3 | Bot Clear | 175.44 |
| Neuro-CMA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 536.9 | Bot Clear | 175.44 |
| Natural ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 731.4 | Top Clear | 175.44 |
| Adam-ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 161.8 | Vel Vy | 175.44 |
| GA | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 3121.4 | Top Clear | 175.44 |
| Adam-ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 0 | STAGNATED (G19) | 9500 | 6850.0 | Pipe DX | 0 |
| CEM | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 1913.7 | Bot Clear | 175.44 |
| PSO | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2032.4 | Top Clear | 175.44 |
| Neuro-CMA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G11) | 5500 | 4178.2 | Top Clear | 175.44 |
| Adaptive ES | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1056.5 | Bot Clear | 175.44 |
| Diff. Evol. | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 264.4 | Bot Clear | 175.44 |
| Natural ES | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 281.5 | Top Clear | 175.44 |
| Adaptive ES | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 1187.9 | Bot Clear | 175.44 |
| PSO | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 2850.5 | Top Clear | 175.44 |
| Diff. Evol. | Standard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 615.8 | Bot Clear | 175.44 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 0 | STAGNATED (G24) | 1440 | 1927.6 | Bird Y | 0 |
| Neuro-CMA | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1288.2 | Bot Clear | 175.44 |
| CEM | Easy | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 519.8 | Bot Clear | 175.44 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 200.6 | Top Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 209.3 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 0 | STAGNATED (G16) | 960 | 232.7 | Top Clear | 0 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 407.8 | Top Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 277.0 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 1813.9 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 1 | STAGNATED (G37) | 2220 | 3319.8 | Top Clear | 0.01 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 1846.6 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G19) | 1140 | 11470.7 | Bot Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G27) | 1620 | 2608.8 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 91.6 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 119.2 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 143.9 | Top Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 0 | STAGNATED (G52) | 3120 | 4119.8 | Bot Clear | 0 |
| GA | Hard | 5→4→4→2→1 | 3 | 10n | 46w | 57p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 3638.3 | Bot Clear | 175.44 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 2702.5 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 7280.7 | Top Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G14) | 840 | 1112.1 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G22) | 1320 | 1072.5 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 158.5 | Top Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 100.6 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 1 | STAGNATED (G22) | 1320 | 352.9 | Top Clear | 0.01 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 871.8 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 79.3 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 521.3 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1748.2 | Top Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1435.0 | Top Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 1151.5 | Top Clear | 0 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.15 | 10000 | Perfect (G15) | 900 | 7909.5 | Bot Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 566.7 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 0 | STAGNATED (G23) | 1380 | 1440.1 | Vel Vy | 0 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 347.4 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 358.8 | Bot Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 760.4 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 144.8 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G41) | 2460 | 7965.9 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 292.6 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 271.6 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G25) | 1500 | 6809.7 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1362.4 | Top Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 362.9 | Top Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 917.5 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 452.5 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 0 | STAGNATED (G20) | 1200 | 339.0 | Bird Y | 0 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G17) | 1020 | 5678.0 | Top Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 1417.9 | Top Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G13) | 780 | 1905.8 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 376.9 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G37) | 2220 | 2017.7 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 1979.3 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 427.6 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 0 | STAGNATED (G55) | 3300 | 2968.3 | Top Clear | 0 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 801.5 | Top Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 268.1 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.30 | 10000 | Perfect (G22) | 1320 | 6604.2 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 9089.6 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 1332.4 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 1971.3 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 387.0 | Bot Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 125.0 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 3261.4 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 1269.8 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 1913.6 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 216.2 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 79.8 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 1 | STAGNATED (G34) | 2040 | 1890.7 | Bot Clear | 0.01 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 583.4 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 0 | STAGNATED (G27) | 4050 | 5478.1 | Pipe DX | 0 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 3697.6 | Top Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G26) | 1560 | 3674.0 | Top Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 214.4 | Bird Y | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G6) | 900 | 2416.0 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 137.1 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 439.5 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G21) | 3150 | 7174.9 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 66.8 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 2613.9 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G9) | 1350 | 3374.8 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 60 | 0.50 | 10000 | Perfect (G11) | 660 | 2288.3 | Bot Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 636.3 | Bot Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 320.7 | Vel Vy | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 2439.6 | Top Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 221.8 | Top Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 659.8 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G27) | 4050 | 15994.5 | Top Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G13) | 1950 | 2744.2 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 232.4 | Top Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 326.3 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G12) | 1800 | 1698.5 | Top Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 991.6 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G26) | 3900 | 9338.2 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 2812.7 | Top Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G14) | 2100 | 9024.9 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1024.3 | Bot Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 1661.8 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 1567.8 | Top Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1204.9 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 552.3 | Top Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 2453.6 | Bot Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 3536.2 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1687.9 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 86.5 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 1379.6 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 1571.5 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 210.5 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 573.0 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 2075.6 | Bot Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 293.7 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 1551.5 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 3255.8 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 568.1 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 204.6 | Top Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G8) | 1200 | 1674.2 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 278.3 | Top Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 214.9 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G16) | 2400 | 1528.4 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 724.6 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 1244.0 | Pipe DX | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G19) | 2850 | 2427.2 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G10) | 1500 | 3160.6 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 149.9 | Bot Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.30 | 10000 | Perfect (G2) | 300 | 1586.4 | Bot Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 345.1 | Top Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G10) | 1500 | 2515.5 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 1551.7 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1263.7 | Pipe DX | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 437.0 | Top Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 133.1 | Top Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.15 | 6269 | STAGNATED (G18) | 2700 | 20620.8 | Top Clear | 83.59 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1425.5 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 7446 | STAGNATED (G38) | 5700 | 4034.3 | Bot Clear | 99.28 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G24) | 3600 | 5371.6 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 598.7 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 4204.5 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 458.3 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 838.3 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G8) | 1200 | 476.3 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1000.6 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G15) | 2250 | 2753.2 | Top Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 100.7 | Top Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 147.8 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 1187.9 | Bird Y | 0 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 1604 | STAGNATED (G24) | 3600 | 22703.3 | Top Clear | 21.39 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1416.4 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 148.9 | Pipe DX | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 436.0 | Top Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G35) | 10500 | 9366.0 | Top Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1298.4 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G12) | 3600 | 5280.6 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 2802.1 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 375.1 | Top Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4812.6 | Top Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G11) | 3300 | 1679.0 | Bot Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 5403.5 | Top Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 2094.9 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 509.0 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 871.6 | Top Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G22) | 6600 | 2026.2 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G6) | 1800 | 2107.4 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 1387.5 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 3103.0 | Bot Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2351.2 | Top Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 439.2 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 2120.3 | Top Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 643.4 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 752.5 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 651.0 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 158.7 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 388.5 | Bot Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 703.1 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 3645.5 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G10) | 3000 | 1775.9 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 534.1 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 480.7 | Bot Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 147.9 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G16) | 4800 | 3762.9 | Bot Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 3968.9 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 147.9 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 223.4 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G18) | 5400 | 6730.0 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2472.8 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.15 | 10000 | Perfect (G8) | 2400 | 14315.4 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G6) | 1800 | 1086.3 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 2801.2 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 262.4 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G13) | 3900 | 6800.0 | Top Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 537.1 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 412 | STAGNATED (G29) | 8700 | 11719.0 | Top Clear | 5.49 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 208.2 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G9) | 2700 | 4174.9 | Top Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G15) | 4500 | 2008.7 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 1167.7 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 284.9 | Pipe DX | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 395.7 | Pipe DX | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 2708.1 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G31) | 9300 | 14454.9 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.30 | 10000 | Perfect (G8) | 2400 | 6497.7 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G13) | 3900 | 13089.2 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 862.6 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 299.6 | Top Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 2187.9 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1627.4 | Top Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 130.0 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 1603.1 | Bot Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 2861.1 | Top Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 806.0 | Top Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 7738.2 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 442.2 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G8) | 2400 | 2494.5 | Bot Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 2625.4 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G15) | 4500 | 4467.9 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 485.7 | Top Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 844.8 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 960.4 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 1076.3 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 833.8 | Top Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 5725.9 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 900.2 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G18) | 9000 | 16619.6 | Bot Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 2360.9 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 0 | STAGNATED (G20) | 10000 | 2468.6 | Bird Y | 0 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 243.0 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 260.0 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G16) | 8000 | 18310.7 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 0 | STAGNATED (G16) | 8000 | 9743.3 | Vel Vy | 0 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 543.0 | Top Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 1026.9 | Top Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 1204.2 | Top Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G8) | 4000 | 7247.0 | Vel Vy | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G5) | 2500 | 1213.8 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 923.6 | Bot Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 9137.8 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 287.4 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G11) | 5500 | 7371.2 | Top Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G11) | 5500 | 6117.3 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 419.0 | Bot Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 810.1 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 96 | STAGNATED (G18) | 9000 | 11878.0 | Top Clear | 1.28 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 2486.7 | Bot Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 256.3 | Top Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3968.9 | Bot Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 997.3 | Top Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 900.7 | Bot Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 340.2 | Bot Clear | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 7284.0 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G9) | 4500 | 6849.4 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 4871.1 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1736.5 | Bot Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 7904.2 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G22) | 11000 | 12510.6 | Bot Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 195.8 | Top Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G6) | 3000 | 32153.0 | Bot Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 226.3 | Top Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 549.8 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 330.2 | Top Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 967.4 | Bot Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 170.4 | Bot Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 972.5 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G15) | 7500 | 7075.6 | Top Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1866.1 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 324.1 | Top Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1143.5 | Bot Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1502.9 | Pipe DX | 133.33 |
| Natural ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 195.2 | Top Clear | 133.33 |
| GA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 272.8 | Bot Clear | 133.33 |
| Adaptive ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 353.8 | Bot Clear | 133.33 |
| Diff. Evol. | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 2493.5 | Bot Clear | 133.33 |
| CEM | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 796.0 | Bot Clear | 133.33 |
| PSO | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 265.8 | Bot Clear | 133.33 |
| Adam-ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 1554.3 | Top Clear | 133.33 |
| GA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 869.5 | Bot Clear | 133.33 |
| Neuro-CMA | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 4736.3 | Bot Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.30 | 10000 | Perfect (G13) | 6500 | 20717.4 | Bot Clear | 133.33 |
| Adaptive ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1005.6 | Bot Clear | 133.33 |
| Diff. Evol. | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 701.2 | Bot Clear | 133.33 |
| Natural ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G14) | 7000 | 2566.3 | Top Clear | 133.33 |
| CEM | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G18) | 9000 | 5782.3 | Bot Clear | 133.33 |
| PSO | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1119.2 | Bot Clear | 133.33 |
| Adam-ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 1753.6 | Bot Clear | 133.33 |
| GA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 3138.8 | Top Clear | 133.33 |
| Adam-ES | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 828.5 | Top Clear | 133.33 |
| Natural ES | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 3247.1 | Bot Clear | 133.33 |
| Diff. Evol. | Standard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 550.5 | Top Clear | 133.33 |
| PSO | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 954.9 | Bot Clear | 133.33 |
| CEM | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 255.0 | Top Clear | 133.33 |
| Neuro-CMA | Easy | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1847.0 | Top Clear | 133.33 |
| Adaptive ES | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G6) | 3000 | 3068.7 | Bot Clear | 133.33 |
| Neuro-CMA | Hard | 5→6→2→6→1 | 3 | 14n | 60w | 75p | 500 | 0.50 | 10000 | Perfect (G10) | 5000 | 7447.9 | Top Clear | 133.33 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G28) | 1680 | 9340.3 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 1307.7 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G5) | 300 | 3080.3 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G22) | 1320 | 968.0 | Bot Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 1261.0 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G8) | 480 | 3178.0 | Bot Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 345.8 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 5808.0 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G9) | 540 | 1898.7 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 3876.6 | Pipe DX | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G18) | 1080 | 4006.2 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G7) | 420 | 2204.4 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 0 | STAGNATED (G17) | 1020 | 2238.2 | Bird Y | 0 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 318 | STAGNATED (G22) | 1320 | 16548.4 | Top Clear | 2.47 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G4) | 240 | 384.6 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 386.1 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 639.1 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 170.3 | Top Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 780.4 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G2) | 120 | 210.8 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 26 | STAGNATED (G21) | 1260 | 2094.2 | Bot Clear | 0.2 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G16) | 960 | 10038.1 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 0 | STAGNATED (G38) | 2280 | 3665.7 | Top Clear | 0 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G3) | 180 | 1703.3 | Bot Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 452.2 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G13) | 780 | 2819.0 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.15 | 10000 | Perfect (G6) | 360 | 2598.2 | Pipe DX | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 977.2 | Top Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G20) | 1200 | 7278.8 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 1893.2 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G1) | 60 | 70.2 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 609.3 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 600.5 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 7272.7 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 2233.7 | Pipe DX | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 1096.6 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 3448.7 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 378.2 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G3) | 180 | 352.6 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G8) | 480 | 1113.9 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G10) | 600 | 1611.6 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G7) | 420 | 1626.8 | Pipe DX | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 185 | STAGNATED (G41) | 2460 | 3989.9 | Bot Clear | 1.43 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 174.3 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G6) | 360 | 5130.6 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G2) | 120 | 237.9 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G4) | 240 | 435.3 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 243.2 | Top Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G5) | 300 | 945.2 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.30 | 10000 | Perfect (G16) | 960 | 8637.3 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G13) | 780 | 3247.1 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 1799.4 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G4) | 240 | 1535.5 | Vel Vy | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 2326.6 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 144.7 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G31) | 1860 | 3361.8 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G36) | 2160 | 5339.4 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G9) | 540 | 1418.4 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 758.3 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 329.7 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G2) | 120 | 356.9 | Pipe DX | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G8) | 480 | 2373.4 | Bot Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G14) | 840 | 3679.1 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G22) | 1320 | 7600.3 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G12) | 720 | 2520.8 | Top Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 203.8 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G10) | 600 | 1426.1 | Top Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G5) | 300 | 299.5 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 759.5 | Bird Y | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G3) | 180 | 317.0 | Top Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G7) | 420 | 5594.5 | Bot Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 710.4 | Vel Vy | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 1311.3 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 269.3 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2967.5 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1864.3 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 0 | STAGNATED (G16) | 2400 | 1021.3 | Pipe DX | 0 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 60 | 0.50 | 10000 | Perfect (G18) | 1080 | 4076.9 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 718.7 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 1941.6 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G4) | 600 | 536.3 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G18) | 2700 | 15822.4 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G16) | 2400 | 4328.2 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 2385.4 | Top Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 3576.8 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G15) | 2250 | 13593.7 | Bot Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G8) | 1200 | 9801.3 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G7) | 1050 | 2419.0 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G3) | 450 | 888.0 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 727.1 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 4981.6 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 0 | STAGNATED (G21) | 3150 | 7223.7 | Pipe DX | 0 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G1) | 150 | 239.2 | Top Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G5) | 750 | 1224.3 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G10) | 1500 | 8823.5 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 527.1 | Bot Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 182.3 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 149.4 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 476.3 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.15 | 10000 | Perfect (G2) | 300 | 282.1 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 255.5 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G18) | 2700 | 10301.0 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 8834.8 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 2373.4 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G20) | 3000 | 6591.8 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1595.9 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 819.1 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 519.9 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 204.8 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G14) | 2100 | 2404.4 | Top Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 786.2 | Bot Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G11) | 1650 | 4146.8 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G4) | 600 | 1244.6 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G1) | 150 | 247.2 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G7) | 1050 | 4349.1 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 554.9 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G3) | 450 | 1760.2 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 8270.7 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 10000 | Perfect (G5) | 750 | 3726.9 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G26) | 3900 | 6397.2 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G21) | 3150 | 6626.1 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 779.6 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.30 | 827 | STAGNATED (G21) | 3150 | 16195.2 | Bot Clear | 6.41 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 549.4 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 1318.9 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 217.3 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G6) | 900 | 1814.0 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 4704.9 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G4) | 600 | 1435.7 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 251.8 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 189.7 | Bot Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 5231.5 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 5217.3 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G9) | 1350 | 2028.2 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 401.8 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G7) | 1050 | 2746.2 | Top Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 33 | STAGNATED (G26) | 3900 | 11168.8 | Top Clear | 0.26 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G1) | 150 | 260.0 | Bot Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G5) | 750 | 1310.1 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G3) | 450 | 1354.8 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G12) | 1800 | 5209.8 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 2661 | STAGNATED (G22) | 3300 | 24241.6 | Top Clear | 20.63 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G2) | 300 | 740.3 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 150 | 0.50 | 10000 | Perfect (G21) | 3150 | 46202.8 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1972.8 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G7) | 2100 | 4386.5 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 2226.6 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G20) | 6000 | 24981.5 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 371.1 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 2003.6 | Bot Clear | 0 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 463.4 | Bot Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 809.0 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 361.7 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 12101.5 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 0 | STAGNATED (G16) | 4800 | 1666.4 | Top Clear | 0 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 660.9 | Top Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G15) | 4500 | 35690.3 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 8325.5 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G9) | 2700 | 3413.9 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 4916.9 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1019.1 | Top Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 5371.1 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G1) | 300 | 996.9 | Top Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G10) | 3000 | 7845.1 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G3) | 900 | 1789.2 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G2) | 600 | 1449.0 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 433.3 | Top Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G5) | 1500 | 2978.3 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.15 | 10000 | Perfect (G4) | 1200 | 1499.5 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 767.0 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1177.5 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 761.6 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 393.2 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 3084.3 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 4583.3 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 296.9 | Top Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 353.2 | Bot Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G5) | 1500 | 1920.8 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G16) | 4800 | 19926.2 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G2) | 600 | 455.5 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G13) | 3900 | 10971.0 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3342.2 | Top Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 356.7 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 302.1 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1693.9 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 271.4 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3654.6 | Pipe DX | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G1) | 300 | 271.2 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 1940.0 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G4) | 1200 | 3013.1 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 445.4 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 2113.0 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1776.3 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G7) | 2100 | 8022.1 | Bot Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 2019.9 | Bot Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.30 | 10000 | Perfect (G3) | 900 | 10950.6 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 4641.5 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G6) | 1800 | 2131.6 | Top Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 837.0 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 4331.0 | Bot Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G19) | 5700 | 5196.1 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 852.2 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 1508.0 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 309.9 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G4) | 1200 | 3770.0 | Top Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 3692.4 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 877.8 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G11) | 3300 | 6914.7 | Bot Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 738.1 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1156.4 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G1) | 300 | 290.6 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G5) | 1500 | 2970.7 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 524.4 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G7) | 2100 | 10101.4 | Top Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G2) | 600 | 1644.0 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G3) | 900 | 8454.1 | Bird Y | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 300 | 0.50 | 10000 | Perfect (G14) | 4200 | 12659.9 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3121.6 | Bird Y | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 2033.8 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 12315.5 | Bot Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G9) | 4500 | 11728.0 | Bot Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 889.2 | Bot Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 5577.1 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 7477.3 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1523.5 | Top Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 1114.4 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 994.9 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 559.1 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 826.7 | Pipe DX | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 2561.1 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 7115.9 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 7224.4 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 3489.0 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 3029.9 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G7) | 3500 | 2397.5 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G1) | 500 | 377.7 | Bird Y | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G4) | 2000 | 4878.1 | Bot Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 532.6 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G2) | 1000 | 3822.5 | Vel Vy | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 682.6 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G3) | 1500 | 4802.3 | Bot Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 12374.8 | Top Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 1946.7 | Pipe DX | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G7) | 3500 | 6526.7 | Top Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 14336.4 | Top Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 7404.4 | Top Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.15 | 10000 | Perfect (G6) | 3000 | 7189.6 | Top Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G10) | 5000 | 11645.0 | Top Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 3579.2 | Bot Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 6326.7 | Top Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 1194.8 | Bot Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 9560.5 | Bot Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 561.1 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 3059.9 | Bot Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 2669.9 | Top Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 832.0 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G5) | 2500 | 4431.1 | Top Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G3) | 1500 | 4571.8 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 458.5 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 661.6 | Top Clear | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G4) | 2000 | 23657.2 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G2) | 1000 | 1250.0 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G1) | 500 | 547.1 | Pipe DX | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.30 | 10000 | Perfect (G8) | 4000 | 12572.5 | Top Clear | 77.52 |
| GA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 792.9 | Top Clear | 77.52 |
| Adam-ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 7514.3 | Top Clear | 77.52 |
| Natural ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G8) | 4000 | 3293.8 | Top Clear | 77.52 |
| Adaptive ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 525.8 | Bot Clear | 77.52 |
| Neuro-CMA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1482.5 | Bot Clear | 77.52 |
| CEM | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 418.0 | Bot Clear | 77.52 |
| PSO | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 735.4 | Top Clear | 77.52 |
| GA | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2577.7 | Bot Clear | 77.52 |
| Diff. Evol. | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 7353.0 | Bot Clear | 77.52 |
| Adaptive ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 2565.2 | Bot Clear | 77.52 |
| CEM | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G7) | 3500 | 4151.8 | Bot Clear | 77.52 |
| PSO | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2274.6 | Top Clear | 77.52 |
| Diff. Evol. | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 934.5 | Top Clear | 77.52 |
| Natural ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G16) | 8000 | 10763.8 | Bot Clear | 77.52 |
| Adam-ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 2657.4 | Vel Vy | 77.52 |
| Neuro-CMA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G3) | 1500 | 2126.5 | Top Clear | 77.52 |
| Adam-ES | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 849.5 | Bot Clear | 77.52 |
| Adaptive ES | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 6307.1 | Top Clear | 77.52 |
| GA | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G5) | 2500 | 2534.3 | Bot Clear | 77.52 |
| Natural ES | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G1) | 500 | 443.4 | Top Clear | 77.52 |
| Diff. Evol. | Standard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1439.6 | Bot Clear | 77.52 |
| PSO | Hard | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G4) | 2000 | 3628.9 | Bot Clear | 77.52 |
| CEM | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 3283.6 | Top Clear | 77.52 |
| Neuro-CMA | Easy | 5→12→4→1 | 2 | 16n | 112w | 129p | 500 | 0.50 | 10000 | Perfect (G2) | 1000 | 1441.9 | Top Clear | 77.52 |