#!/usr/bin/env python3
"""
Flappy NeuroLab — Standalone Python 3 Meta-Analysis CLI (Zero Third-Party Deps)

Ingests Research Lab JSON exports, JSONL trial streams, or CSV exports and computes:
  - Difficulty regime & normalized-tier performance tables
  - Exact Paired Morphogenesis A/B Comparison (wins/ties/losses, mean/median Δ, two-sided sign test)
  - 12-Sensor Discovery Meta-Analysis ("Why & When" lift across Static, Moving, and Turbulent regimes)
  - Architecture & Optimizer rankings + Failure Autopsy breakdown
  - Outputs: python-meta-analysis.md & python-summary.json

Usage:
  python3 scripts/analyze_neurolab.py --input trials.jsonl --out-dir ./analysis-out
  python3 scripts/analyze_neurolab.py --self-test
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
import tempfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ALL_SENSORS = [
    "BIRD_Y",
    "VEL_VY",
    "PIPE_DX",
    "TOP_CLEAR",
    "BOT_CLEAR",
    "PIPE_VY",
    "NEXT_PIPE_DY",
    "NEXT_TOP_CLEAR",
    "NEXT_BOT_CLEAR",
    "NEXT_PIPE_DX",
    "NEXT_PIPE_VY",
    "PIPE_TTF",
]

SENSOR_GUIDE: Dict[str, Tuple[str, str]] = {
    "BIRD_Y": ("Altitude", "Detects floor/ceiling boundary risk; optional when clearances exist."),
    "VEL_VY": ("Kinematics", "Vertical momentum enables early braking on moving/heavy-gravity tiers."),
    "PIPE_DX": ("Pipe #1", "Horizontal timing edge for final flap clearance."),
    "TOP_CLEAR": ("Pipe #1", "Upper-lip margin; critical when gapVariance > 0 or gap moves."),
    "BOT_CLEAR": ("Pipe #1", "Primary jump-threshold anchor sufficient on calm static courses."),
    "PIPE_VY": ("Pipe #1", "Gap vertical velocity; essential on Hard/Insane oscillating pipes."),
    "NEXT_PIPE_DY": ("Pipe #2", "Center delta from Pipe #1 to Pipe #2 for early altitude staging."),
    "NEXT_TOP_CLEAR": ("Pipe #2", "Relative clearance to Pipe #2 upper lip (invariant to gap width)."),
    "NEXT_BOT_CLEAR": ("Pipe #2", "Relative clearance to Pipe #2 bottom lip for Bot-first lookahead."),
    "NEXT_PIPE_DX": ("Pipe #2", "Horizontal distance to Pipe #2 to weigh lookahead urgency."),
    "NEXT_PIPE_VY": ("Pipe #2", "Pipe #2 vertical velocity for coupled multi-pipe interception."),
    "PIPE_TTF": ("Timing", "Wind-compensated Time-To-Pipe (DX / tickSpeed) stabilizing gust chaos."),
}

LEGACY_DIFF_MAP = {
    "EASY": "EASY",
    "MEDIUM": "MEDIUM",
    "HARD": "HARD",
    "INSANE": "INSANE",
    "STANDARD": "EASY",
    "VARIABLE_SPEED": "MEDIUM",
    "DYNAMIC_GAPS": "MEDIUM",
    "HEAVY_GRAVITY": "HARD",
    "MOVING_GUSTS": "HARD",
    "MOVING_GAPS": "HARD",
    "GUST_CHAOS": "INSANE",
    "TURBULENCE_EXTREME": "INSANE",
    "CUSTOM": "CUSTOM",
}

MOVING_DIFFS = {"HARD", "INSANE", "MOVING_GAPS", "MOVING_GUSTS", "GUST_CHAOS", "TURBULENCE_EXTREME"}
TURBULENT_DIFFS = {
    "MEDIUM",
    "HARD",
    "INSANE",
    "VARIABLE_SPEED",
    "MOVING_GUSTS",
    "GUST_CHAOS",
    "TURBULENCE_EXTREME",
}


def exact_sign_test_pvalue(wins_b: int, wins_a: int) -> Optional[float]:
    n = wins_b + wins_a
    if n <= 0:
        return None
    k = min(wins_b, wins_a)
    total = 0.0
    for i in range(k + 1):
        total += math.comb(n, i) * (0.5 ** n)
    return round(min(1.0, 2.0 * total), 4)


def parse_bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val != 0
    return str(val).strip().lower() in {"true", "1", "yes"}


def normalize_trial(raw: Dict[str, Any], idx: int) -> Dict[str, Any]:
    diff = str(raw.get("difficulty", "MEDIUM")).upper()
    norm_diff = str(raw.get("normalizedDifficulty") or LEGACY_DIFF_MAP.get(diff, diff)).upper()

    feats_raw = raw.get("inputFeatures")
    if isinstance(feats_raw, list):
        feats = [str(f) for f in feats_raw if str(f) in ALL_SENSORS]
    elif isinstance(raw.get("input_features"), str):
        toks = [t.strip() for t in raw["input_features"].replace("|", ",").split(",") if t.strip()]
        feats = [t for t in toks if t in ALL_SENSORS]
    else:
        feats = []

    if not feats:
        cnt = int(raw.get("inputCount") or raw.get("input_count") or 5)
        feats = ALL_SENSORS[: max(1, min(len(ALL_SENSORS), cnt))]

    # Canonical sensor order key
    feat_set = set(feats)
    ordered_feats = [s for s in ALL_SENSORS if s in feat_set]

    imp_map: Dict[str, float] = {}
    if isinstance(raw.get("sensorImportance"), dict):
        for k, v in raw["sensorImportance"].items():
            imp_map[str(k)] = float(v)
    elif isinstance(raw.get("policyProfile"), dict) and isinstance(
        raw["policyProfile"].get("sensorImportance"), list
    ):
        vec = raw["policyProfile"]["sensorImportance"]
        for i, s in enumerate(ALL_SENSORS):
            if i < len(vec):
                imp_map[s] = float(vec[i])

    ms = raw.get("morphogenesisSummary") or {}
    init_p = ms.get("initialActiveParams") if isinstance(ms, dict) else None
    final_p = ms.get("finalActiveParams") if isinstance(ms, dict) else None
    if init_p is None and raw.get("initial_active_params") not in (None, ""):
        init_p = float(raw["initial_active_params"])
    if final_p is None and raw.get("final_active_params") not in (None, ""):
        final_p = float(raw["final_active_params"])
    pruned = (
        ms.get("prunedSynapses")
        if isinstance(ms, dict) and ms.get("prunedSynapses") is not None
        else (float(raw["pruned_synapses"]) if raw.get("pruned_synapses") not in (None, "") else 0.0)
    )
    arch = str(raw.get("architecture", "MLP"))
    evo_mode = str(raw.get("evolutionTopologyMode") or raw.get("evolution_topology_mode") or "SINGLE_SPECIES")
    default_profile = "CPU_SPECIALIZED" if (arch == "HYBRID_MOE" or evo_mode == "ISLAND_SPECIATION") else "GPU_LOCKSTEP"
    compute_profile = str(raw.get("computeProfile") or raw.get("compute_profile") or default_profile)
    raw_flops = raw.get("meanFlopsPerFrame") if raw.get("meanFlopsPerFrame") is not None else raw.get("mean_flops_per_frame")
    if raw_flops in (None, "") and isinstance(ms, dict) and ms.get("avgFlopsPerFrame") is not None:
        raw_flops = ms.get("avgFlopsPerFrame")
    mean_flops = float(raw_flops) if raw_flops not in (None, "") else max(1.0, float(raw.get("parameterCount") or raw.get("parameter_count") or 10) * 2.0)
    raw_eff = raw.get("computeEfficiencyScore") if raw.get("computeEfficiencyScore") is not None else raw.get("compute_efficiency_score")
    eff_score = float(raw_eff) if raw_eff not in (None, "") else round(float(raw.get("minSeedScore") if "minSeedScore" in raw else raw.get("min_seed_score", 0)) / max(0.01, mean_flops / 100.0), 2)

    rollbacks = int(ms.get("rollbackCount", 0)) if isinstance(ms, dict) and ms.get("rollbackCount") is not None else int(float(raw.get("hybrid_rollbacks") or 0))
    commits = int(ms.get("committedExpertsCount", 0)) if isinstance(ms, dict) and ms.get("committedExpertsCount") is not None else int(float(raw.get("hybrid_commits") or 0))
    isl = raw.get("islandSummary") if isinstance(raw.get("islandSummary"), dict) else None
    win_species = str(isl.get("winningSpecies")) if (isl and isl.get("enabled") and isl.get("winningSpecies")) else (str(raw.get("island_winning_species")) if raw.get("island_winning_species") else None)
    rebalance_cnt = int(isl.get("rebalanceCount", 0)) if isl else 0

    return {
        "id": str(raw.get("id", f"trial-{idx}")),
        "algorithm": str(raw.get("algorithm", "DE")),
        "difficulty": diff,
        "normalizedDifficulty": norm_diff,
        "architecture": arch,
        "weightPrecision": str(raw.get("weightPrecision") or raw.get("weight_precision") or "FP32"),
        "evolutionTopologyMode": evo_mode,
        "computeProfile": compute_profile,
        "meanFlopsPerFrame": mean_flops,
        "computeEfficiencyScore": eff_score,
        "rollbackCount": rollbacks,
        "committedExpertsCount": commits,
        "winningSpecies": win_species,
        "rebalanceCount": rebalance_cnt,
        "morphogenesisMode": str(raw.get("morphogenesisMode") or raw.get("morphogenesis_mode") or "STATIC"),
        "topologyLabel": str(raw.get("topologyLabel") or raw.get("topology_label") or "?"),
        "inputFeatures": ordered_feats,
        "inputKey": ",".join(ordered_feats),
        "parameterCount": int(float(raw.get("parameterCount") or raw.get("parameter_count") or 0)),
        "populationSize": int(float(raw.get("populationSize") or raw.get("population_size") or 120)),
        "mutationStrength": float(raw.get("mutationStrength") or raw.get("mutation_strength") or 0.35),
        "targetPipeCap": int(float(raw.get("targetPipeCap") or raw.get("target_pipe_cap") or 500)),
        "verifiedPerfect": parse_bool(raw.get("verifiedPerfect") if "verifiedPerfect" in raw else raw.get("verified_perfect", False)),
        "minSeedScore": float(raw.get("minSeedScore") if "minSeedScore" in raw else raw.get("min_seed_score", 0)),
        "meanSeedScore": float(raw.get("meanSeedScore") if "meanSeedScore" in raw else raw.get("mean_seed_score", 0)),
        "normalizedComputeMs": float(raw.get("normalizedComputeMs") if "normalizedComputeMs" in raw else raw.get("normalized_compute_ms", 0)),
        "learningDynamic": raw.get("learningDynamic"),
        "failureAutopsy": raw.get("failureAutopsy"),
        "sensorImportance": imp_map,
        "initActiveParams": float(init_p) if init_p is not None else None,
        "finalActiveParams": float(final_p) if final_p is not None else None,
        "prunedSynapses": float(pruned),
    }


def load_trials(path: Path) -> List[Dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        with path.open("r", encoding="utf-8", newline="") as fh:
            reader = csv.DictReader(fh)
            return [normalize_trial(row, i) for i, row in enumerate(reader)]

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    if suffix == ".jsonl" or (not text.startswith("{") and not text.startswith("[")):
        out = []
        for i, line in enumerate(text.splitlines()):
            line = line.strip()
            if not line:
                continue
            out.append(normalize_trial(json.loads(line), i))
        return out

    payload = json.loads(text)
    if isinstance(payload, list):
        return [normalize_trial(r, i) for i, r in enumerate(payload)]
    if isinstance(payload, dict) and isinstance(payload.get("trials"), list):
        return [normalize_trial(r, i) for i, r in enumerate(payload["trials"])]
    raise ValueError(f"Unsupported input payload structure in {path}")


def analyze_trials(trials: List[Dict[str, Any]]) -> Dict[str, Any]:
    n_total = len(trials)
    n_perfect = sum(1 for t in trials if t["verifiedPerfect"])

    # 1. Regime Breakdown
    by_diff: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for t in trials:
        by_diff[t["normalizedDifficulty"]].append(t)

    regime_rows = []
    for diff, group in sorted(by_diff.items()):
        perf = sum(1 for t in group if t["verifiedPerfect"])
        scores = [t["minSeedScore"] for t in group]
        comps = [t["normalizedComputeMs"] for t in group if t["normalizedComputeMs"] > 0]
        regime_rows.append(
            {
                "difficulty": diff,
                "trials": len(group),
                "perfect": perf,
                "perfectPct": round((perf / len(group)) * 100, 1),
                "meanMinSeed": round(statistics.mean(scores), 1),
                "maxMinSeed": round(max(scores), 1),
                "avgComputeMs": round(statistics.mean(comps), 1) if comps else None,
            }
        )

    # 2. Paired Morphogenesis A/B
    static_map: Dict[Tuple[Any, ...], Dict[str, Any]] = {}
    growing_list = [t for t in trials if t["morphogenesisMode"] == "GROWING"]
    static_list = [t for t in trials if t["morphogenesisMode"] != "GROWING"]

    def pair_key(t: Dict[str, Any]) -> Tuple[Any, ...]:
        return (
            t["algorithm"],
            t["difficulty"],
            t["topologyLabel"],
            t["inputKey"],
            t["weightPrecision"],
            t["populationSize"],
            round(t["mutationStrength"], 2),
            t["targetPipeCap"],
        )

    for s in static_list:
        k = pair_key(s)
        prev = static_map.get(k)
        if prev is None or s["minSeedScore"] > prev["minSeedScore"]:
            static_map[k] = s

    seen_keys = set()
    deltas: List[float] = []
    wins_grow = 0
    wins_stat = 0
    ties = 0
    for g in growing_list:
        k = pair_key(g)
        if k in seen_keys:
            continue
        s = static_map.get(k)
        if s is None:
            continue
        seen_keys.add(k)
        d = g["minSeedScore"] - s["minSeedScore"]
        deltas.append(d)
        if d > 0:
            wins_grow += 1
        elif d < 0:
            wins_stat += 1
        else:
            ties += 1

    init_params = [g["initActiveParams"] for g in growing_list if g["initActiveParams"]]
    final_params = [g["finalActiveParams"] for g in growing_list if g["finalActiveParams"]]
    morpho_summary = None
    if growing_list:
        morpho_summary = {
            "staticTrials": len(static_list),
            "growingTrials": len(growing_list),
            "staticPerfectPct": round((sum(1 for t in static_list if t["verifiedPerfect"]) / len(static_list)) * 100, 1)
            if static_list
            else None,
            "growingPerfectPct": round((sum(1 for t in growing_list if t["verifiedPerfect"]) / len(growing_list)) * 100, 1),
            "matchedPairs": len(deltas),
            "winsGrowing": wins_grow,
            "winsStatic": wins_stat,
            "ties": ties,
            "meanDeltaScore": round(statistics.mean(deltas), 2) if deltas else None,
            "medianDeltaScore": round(statistics.median(deltas), 2) if deltas else None,
            "signTestPValue": exact_sign_test_pvalue(wins_grow, wins_stat) if deltas else None,
            "avgInitialParams": round(statistics.mean(init_params), 1) if init_params else None,
            "avgFinalParams": round(statistics.mean(final_params), 1) if final_params else None,
            "avgPrunedSynapses": round(statistics.mean(g["prunedSynapses"] for g in growing_list), 1),
        }

    # 3. 12-Sensor Discovery Meta-Analysis
    def regime_lift(sensor: str, predicate) -> Optional[float]:
        w = [t["minSeedScore"] for t in trials if sensor in t["inputFeatures"] and predicate(t)]
        wo = [t["minSeedScore"] for t in trials if sensor not in t["inputFeatures"] and predicate(t)]
        if not w or not wo:
            return None
        return round(statistics.mean(w) - statistics.mean(wo), 1)

    sensor_rows = []
    for sensor in ALL_SENSORS:
        with_scores = [t["minSeedScore"] for t in trials if sensor in t["inputFeatures"]]
        wo_scores = [t["minSeedScore"] for t in trials if sensor not in t["inputFeatures"]]
        jac_vals = [
            t["sensorImportance"][sensor]
            for t in trials
            if sensor in t["inputFeatures"] and sensor in t["sensorImportance"]
        ]
        grp, rationale = SENSOR_GUIDE[sensor]
        sensor_rows.append(
            {
                "sensor": sensor,
                "group": grp,
                "withCount": len(with_scores),
                "withoutCount": len(wo_scores),
                "meanWith": round(statistics.mean(with_scores), 1) if with_scores else None,
                "meanWithout": round(statistics.mean(wo_scores), 1) if wo_scores else None,
                "marginalLift": round(statistics.mean(with_scores) - statistics.mean(wo_scores), 1)
                if with_scores and wo_scores
                else None,
                "staticLift": regime_lift(sensor, lambda t: t["difficulty"] not in MOVING_DIFFS),
                "movingLift": regime_lift(sensor, lambda t: t["difficulty"] in MOVING_DIFFS),
                "turbulentLift": regime_lift(sensor, lambda t: t["difficulty"] in TURBULENT_DIFFS),
                "avgJacobianSharePct": round(statistics.mean(jac_vals), 1) if jac_vals else 0.0,
                "rationale": rationale,
            }
        )

    # 4. Architecture & Optimizer breakdowns
    arch_rows = []
    by_arch: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for t in trials:
        by_arch[t["architecture"]].append(t)
    for arch, grp in sorted(by_arch.items()):
        perf = sum(1 for t in grp if t["verifiedPerfect"])
        arch_rows.append(
            {
                "architecture": arch,
                "trials": len(grp),
                "perfectPct": round((perf / len(grp)) * 100, 1),
                "meanMinSeed": round(statistics.mean(t["minSeedScore"] for t in grp), 1),
                "maxMinSeed": round(max(t["minSeedScore"] for t in grp), 1),
            }
        )

    # 5. Failure Autopsy & Dynamics
    cause_counts: Counter[str] = Counter()
    dyn_counts: Counter[str] = Counter()
    for t in trials:
        if t.get("learningDynamic"):
            dyn_counts[str(t["learningDynamic"])] += 1
        fa = t.get("failureAutopsy")
        if isinstance(fa, dict):
            cause_counts["PIPE_TOP"] += int(fa.get("pipeTopDeaths", 0))
            cause_counts["PIPE_BOTTOM"] += int(fa.get("pipeBottomDeaths", 0))
            cause_counts["FLOOR"] += int(fa.get("floorDeaths", 0))
            cause_counts["CEILING"] += int(fa.get("ceilingDeaths", 0))

    # 6. Hardware Auto-Routing, Compute ROI, Pareto Frontier & Island Winners
    gpu_trials = [t for t in trials if t["computeProfile"] != "CPU_SPECIALIZED"]
    cpu_trials = [t for t in trials if t["computeProfile"] == "CPU_SPECIALIZED"]
    hw_routing = {
        "gpuLockstepTrials": len(gpu_trials),
        "cpuSpecializedTrials": len(cpu_trials),
        "gpuPerfectPct": round((sum(1 for t in gpu_trials if t["verifiedPerfect"]) / len(gpu_trials)) * 100, 1) if gpu_trials else None,
        "cpuPerfectPct": round((sum(1 for t in cpu_trials if t["verifiedPerfect"]) / len(cpu_trials)) * 100, 1) if cpu_trials else None,
        "gpuMeanScore": round(statistics.mean(t["minSeedScore"] for t in gpu_trials), 1) if gpu_trials else None,
        "cpuMeanScore": round(statistics.mean(t["minSeedScore"] for t in cpu_trials), 1) if cpu_trials else None,
        "gpuMeanFlops": round(statistics.mean(t["meanFlopsPerFrame"] for t in gpu_trials), 1) if gpu_trials else None,
        "cpuMeanFlops": round(statistics.mean(t["meanFlopsPerFrame"] for t in cpu_trials), 1) if cpu_trials else None,
    }

    hybrid_group = [t for t in trials if t["architecture"] == "HYBRID_MOE"]
    compute_roi = {
        "avgFlopsPerFrame": round(statistics.mean(t["meanFlopsPerFrame"] for t in trials), 1) if trials else 0.0,
        "avgEfficiencyScore": round(statistics.mean(t["computeEfficiencyScore"] for t in trials), 2) if trials else 0.0,
        "hybridTrials": len(hybrid_group),
        "totalRollbacks": sum(t["rollbackCount"] for t in hybrid_group),
        "totalCommits": sum(t["committedExpertsCount"] for t in hybrid_group),
    }

    pareto_frontier = []
    max_p_score = -1.0
    for t in sorted(trials, key=lambda x: (x["meanFlopsPerFrame"], -x["minSeedScore"])):
        if t["minSeedScore"] > max_p_score:
            max_p_score = t["minSeedScore"]
            pareto_frontier.append(
                {
                    "id": t["id"],
                    "architecture": t["architecture"],
                    "topologyLabel": t["topologyLabel"],
                    "difficulty": t["difficulty"],
                    "computeProfile": t["computeProfile"],
                    "meanFlopsPerFrame": round(t["meanFlopsPerFrame"], 1),
                    "minSeedScore": round(t["minSeedScore"], 1),
                    "efficiencyScore": round(t["computeEfficiencyScore"], 2),
                }
            )

    island_trials = [t for t in trials if t["winningSpecies"]]
    island_winners = []
    if island_trials:
        by_win: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for t in island_trials:
            by_win[str(t["winningSpecies"])].append(t)
        for sp, grp in sorted(by_win.items(), key=lambda kv: (-len(kv[1]), -statistics.mean(x["minSeedScore"] for x in kv[1]))):
            island_winners.append(
                {
                    "species": sp,
                    "wins": len(grp),
                    "winSharePct": round((len(grp) / len(island_trials)) * 100, 1),
                    "meanMinSeed": round(statistics.mean(x["minSeedScore"] for x in grp), 1),
                    "meanFlops": round(statistics.mean(x["meanFlopsPerFrame"] for x in grp), 1),
                }
            )

    return {
        "totalTrials": n_total,
        "perfectTrials": n_perfect,
        "perfectPct": round((n_perfect / n_total) * 100, 1) if n_total else 0.0,
        "regimes": regime_rows,
        "morphogenesis": morpho_summary,
        "sensors": sensor_rows,
        "architectures": arch_rows,
        "hardwareRouting": hw_routing,
        "computeRoi": compute_roi,
        "paretoFrontier": pareto_frontier,
        "islandWinners": island_winners,
        "failureCauses": dict(cause_counts),
        "learningDynamics": dict(dyn_counts),
    }


def render_markdown(summary: Dict[str, Any]) -> str:
    lines = [
        "# Flappy NeuroLab — Python Meta-Analysis Report",
        f"- **Trials**: {summary['totalTrials']} | **Verified Perfect**: {summary['perfectTrials']} ({summary['perfectPct']}%)",
        "",
        "## 1. Scenario Tier Breakdown",
        "| Tier | Trials | Perfect | Perf % | Mean MinSeed | Max MinSeed | Avg Compute (ms) |",
        "| :--- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for r in summary["regimes"]:
        comp = f"{r['avgComputeMs']}" if r["avgComputeMs"] is not None else "—"
        lines.append(
            f"| {r['difficulty']} | {r['trials']} | {r['perfect']} | {r['perfectPct']}% | {r['meanMinSeed']} | {r['maxMinSeed']} | {comp} |"
        )

    if summary["morphogenesis"]:
        m = summary["morphogenesis"]
        lines.extend(
            [
                "",
                "## 2. Paired Morphogenesis A/B Comparison",
                f"- **Matched Pairs**: {m['matchedPairs']} (Wins Growing: {m['winsGrowing']} / Ties: {m['ties']} / Wins Static: {m['winsStatic']})",
                f"- **Mean / Median Δ Pipes**: {m['meanDeltaScore']} / {m['medianDeltaScore']} (Exact Sign-Test p = {m['signTestPValue']})",
                f"- **Perfect Rate**: Growing {m['growingPerfectPct']}% vs Static {m['staticPerfectPct']}%",
                f"- **Active Params**: {m['avgInitialParams']} -> {m['avgFinalParams']} (Avg Pruned Synapses: {m['avgPrunedSynapses']})",
            ]
        )

    lines.extend(
        [
            "",
            "## 3. 12-Sensor Discovery Meta-Analysis ('Why & When')",
            "| Sensor | Group | With / W/O | Marginal Lift | Static | Moving | Turbulent | Jac % | Role |",
            "| :--- | :---: | :---: | ---: | ---: | ---: | ---: | ---: | :--- |",
        ]
    )
    fmt = lambda v: "—" if v is None else f"{'+' if v >= 0 else ''}{v}"
    for s in summary["sensors"]:
        if s["withCount"] == 0:
            continue
        lines.append(
            f"| {s['sensor']} | {s['group']} | {s['withCount']}/{s['withoutCount']} | {fmt(s['marginalLift'])} | {fmt(s['staticLift'])} | {fmt(s['movingLift'])} | {fmt(s['turbulentLift'])} | {s['avgJacobianSharePct']}% | {s['rationale']} |"
        )

    lines.extend(
        [
            "",
            "## 4. Architecture Summary",
            "| Architecture | Trials | Perf % | Mean MinSeed | Max MinSeed |",
            "| :--- | ---: | ---: | ---: | ---: |",
        ]
    )
    for a in summary["architectures"]:
        lines.append(
            f"| {a['architecture']} | {a['trials']} | {a['perfectPct']}% | {a['meanMinSeed']} | {a['maxMinSeed']} |"
        )

    hr = summary["hardwareRouting"]
    cr = summary["computeRoi"]
    lines.extend(
        [
            "",
            "## 5. Compute-Efficiency Pareto Frontier & Hardware Auto-Routing",
            f"- **Hardware Split**: `GPU_LOCKSTEP` = {hr['gpuLockstepTrials']} trials (Mean={hr['gpuMeanScore']}, {hr['gpuMeanFlops']} FLOPs/f) | `CPU_SPECIALIZED` = {hr['cpuSpecializedTrials']} trials (Mean={hr['cpuMeanScore']}, {hr['cpuMeanFlops']} FLOPs/f)",
            f"- **Compute Footprint**: Avg {cr['avgFlopsPerFrame']} FLOPs/f | Score/100-FLOPs = {cr['avgEfficiencyScore']} | Hybrid Commits={cr['totalCommits']} Rollbacks={cr['totalRollbacks']}",
        ]
    )
    if summary["paretoFrontier"]:
        lines.extend(
            [
                "| Pareto Rank | Arch | Topo | Route | FLOPs/f | MinSeed | Score/100-FLOPs |",
                "| :---: | :--- | :---: | :---: | ---: | ---: | ---: |",
            ]
        )
        for idx, pt in enumerate(summary["paretoFrontier"][:8], start=1):
            lines.append(
                f"| P{idx} | {pt['architecture']} | {pt['topologyLabel']} | {pt['computeProfile']} | {pt['meanFlopsPerFrame']} | {pt['minSeedScore']} | {pt['efficiencyScore']} |"
            )

    if summary["islandWinners"]:
        lines.extend(
            [
                "",
                "## 6. Multi-Architecture Island Speciation Winners",
                "| Species | Wins | Win % | Mean MinSeed | Mean FLOPs/f |",
                "| :--- | :---: | :---: | ---: | ---: |",
            ]
        )
        for w in summary["islandWinners"]:
            lines.append(
                f"| {w['species']} | {w['wins']} | {w['winSharePct']}% | {w['meanMinSeed']} | {w['meanFlops']} |"
            )

    if summary["failureCauses"] or summary["learningDynamics"]:
        lines.append("")
        lines.append("## 7. Autopsy & Learning Dynamics")
        if summary["failureCauses"]:
            lines.append(f"- **Crash Causes**: {json.dumps(summary['failureCauses'])}")
        if summary["learningDynamics"]:
            lines.append(f"- **Dynamics**: {json.dumps(summary['learningDynamics'])}")

    return "\n".join(lines) + "\n"


def run_self_test() -> None:
    rows = []
    scenarios = ["EASY", "MEDIUM", "HARD", "INSANE"]
    subsets = [
        (["BOT_CLEAR", "PIPE_DX"], {"BOT_CLEAR": 65.0, "PIPE_DX": 35.0}),
        (
            ["VEL_VY", "PIPE_DX", "TOP_CLEAR", "BOT_CLEAR", "PIPE_VY", "PIPE_TTF"],
            {"BOT_CLEAR": 36.0, "PIPE_DX": 20.0, "PIPE_VY": 22.0, "PIPE_TTF": 14.0, "TOP_CLEAR": 8.0},
        ),
    ]
    idx = 0
    for diff in scenarios:
        is_moving = diff in {"HARD", "INSANE"}
        for feats, imp in subsets:
            for mode in ["STATIC", "GROWING"]:
                idx += 1
                base = 180.0 if diff == "EASY" else 90.0 if diff == "MEDIUM" else 40.0 if diff == "HARD" else 20.0
                if "PIPE_VY" in feats and is_moving:
                    base += 55.0
                if "PIPE_TTF" in feats and diff != "EASY":
                    base += 40.0
                if mode == "GROWING":
                    base += 28.0
                rows.append(
                    {
                        "id": f"selftest-{idx}",
                        "algorithm": "DE",
                        "difficulty": diff,
                        "architecture": "HYBRID_MOE" if (diff in {"HARD", "INSANE"} and mode == "GROWING") else "PONDER_ACT",
                        "weightPrecision": "FP32",
                        "evolutionTopologyMode": "ISLAND_SPECIATION" if (diff == "INSANE" and mode == "GROWING") else "SINGLE_SPECIES",
                        "computeProfile": "CPU_SPECIALIZED" if (diff in {"HARD", "INSANE"} and mode == "GROWING") else "GPU_LOCKSTEP",
                        "meanFlopsPerFrame": 190.0 if (diff in {"HARD", "INSANE"} and mode == "GROWING") else 140.0,
                        "morphogenesisMode": mode,
                        "morphogenesisSummary": {
                            "initialActiveParams": 18,
                            "finalActiveParams": 31,
                            "prunedSynapses": 4,
                            "rollbackCount": 1,
                            "committedExpertsCount": 2,
                        }
                        if mode == "GROWING"
                        else None,
                        "islandSummary": {
                            "enabled": True,
                            "rebalanceCount": 3,
                            "winningSpecies": "HYBRID_MOE",
                        }
                        if (diff == "INSANE" and mode == "GROWING")
                        else None,
                        "topologyLabel": f"{len(feats)}->4->1",
                        "inputFeatures": feats,
                        "parameterCount": 36,
                        "populationSize": 120,
                        "mutationStrength": 0.35,
                        "targetPipeCap": 500,
                        "verifiedPerfect": base >= 500,
                        "minSeedScore": base,
                        "meanSeedScore": base + 6,
                        "normalizedComputeMs": 125.0,
                        "sensorImportance": imp,
                        "learningDynamic": "PHASE_TRANSITION" if mode == "GROWING" else "PLATEAU",
                        "failureAutopsy": {"pipeTopDeaths": 2, "pipeBottomDeaths": 3, "floorDeaths": 0, "ceilingDeaths": 0},
                    }
                )

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        jsonl_file = tmp_path / "fixture.jsonl"
        jsonl_file.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")

        loaded = load_trials(jsonl_file)
        assert len(loaded) == len(rows), f"Expected {len(rows)}, got {len(loaded)}"
        summary = analyze_trials(loaded)
        m = summary["morphogenesis"]
        assert m is not None
        assert m["matchedPairs"] == 8, f"Expected 8 pairs, got {m['matchedPairs']}"
        assert m["winsGrowing"] == 8 and m["winsStatic"] == 0
        assert abs(m["meanDeltaScore"] - 28.0) < 1e-6
        assert m["signTestPValue"] == 0.0078, f"Unexpected sign-test p={m['signTestPValue']}"

        hr = summary["hardwareRouting"]
        assert hr["gpuLockstepTrials"] > 0 and hr["cpuSpecializedTrials"] > 0
        cr = summary["computeRoi"]
        assert cr["hybridTrials"] == 4
        assert cr["totalCommits"] == 8 and cr["totalRollbacks"] == 4
        assert len(summary["paretoFrontier"]) >= 1
        assert len(summary["islandWinners"]) == 1 and summary["islandWinners"][0]["species"] == "HYBRID_MOE"

        pipe_vy_row = next(s for s in summary["sensors"] if s["sensor"] == "PIPE_VY")
        assert pipe_vy_row["movingLift"] is not None and pipe_vy_row["movingLift"] > 50.0
        bot_row = next(s for s in summary["sensors"] if s["sensor"] == "BOT_CLEAR")
        assert bot_row["avgJacobianSharePct"] > 40.0

        md = render_markdown(summary)
        out_dir = tmp_path / "out"
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "python-meta-analysis.md").write_text(md, encoding="utf-8")
        (out_dir / "python-summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
        assert (out_dir / "python-meta-analysis.md").stat().st_size > 200
        assert (out_dir / "python-summary.json").stat().st_size > 200

    print("[PASS] analyze_neurolab.py --self-test passed all Paired Morphogenesis, Hardware Auto-Routing, Hybrid ROI, Pareto, Island, and 12-Sensor Lift assertions.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Flappy NeuroLab Python Meta-Analyzer")
    parser.add_argument("--input", type=Path, help="Input .json, .jsonl, or .csv dataset")
    parser.add_argument("--out-dir", type=Path, default=Path("./analysis-out"), help="Output directory")
    parser.add_argument("--self-test", action="store_true", help="Run built-in unit self-test")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    if not args.input:
        parser.error("Provide --input <file> or --self-test")

    trials = load_trials(args.input)
    summary = analyze_trials(trials)
    md = render_markdown(summary)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    md_path = args.out_dir / "python-meta-analysis.md"
    json_path = args.out_dir / "python-summary.json"
    md_path.write_text(md, encoding="utf-8")
    json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Analyzed {summary['totalTrials']} trials ({summary['perfectTrials']} perfect).")
    if summary["morphogenesis"]:
        m = summary["morphogenesis"]
        print(
            f"Morphogenesis A/B: {m['matchedPairs']} pairs | W/T/L {m['winsGrowing']}/{m['ties']}/{m['winsStatic']} | Mean Δ={m['meanDeltaScore']} (p={m['signTestPValue']})"
        )
    print(f"Outputs written to {args.out_dir}")


if __name__ == "__main__":
    main()
