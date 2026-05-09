"""
resolve_all.py — Pre-resolve ALL BMad skill customizations into a single cache file.

Replaces N lazy Python calls (one per skill) with 1 upfront call.
Skills read from the cache JSON instead of invoking the resolver at runtime.

Output: {project-root}/.claude/.resolved-customizations.json

Usage:
    python _bmad/scripts/resolve_all.py
    npm run session:start    (preflight + this)
"""

import json
import os
import sys
from pathlib import Path

SKILL_DIRS = [
    ".agent/skills",
]

CUSTOM_DIR = "_bmad/custom"
CACHE_FILE = ".claude/.resolved-customizations.json"

SKILL_KEYS = [
    "workflow",
    "template",
    "SKILL",
    "config",
]


def load_toml(path):
    import tomllib
    if path and os.path.isfile(path):
        with open(path, "rb") as f:
            return tomllib.load(f)
    return {}


def deep_merge(base, override):
    if base is None:
        return override
    if override is None:
        return base
    if isinstance(base, dict) and isinstance(override, dict):
        result = dict(base)
        for key, val in override.items():
            if key in result:
                result[key] = deep_merge(result[key], val)
            else:
                result[key] = val
        return result
    return override


def main():
    project_root = Path(os.getcwd())

    # Discover all skills from all skill directories
    skills = {}
    for skill_dir_rel in SKILL_DIRS:
        skill_dir = project_root / skill_dir_rel
        if not skill_dir.is_dir():
            continue
        for entry in sorted(skill_dir.iterdir()):
            if entry.is_dir() and entry.name.startswith("bmad-"):
                skill_name = entry.name
                customize_path = entry / "customize.toml"
                if skill_name not in skills:
                    skills[skill_name] = {
                        "skill_root": str(entry),
                        "has_customize_toml": customize_path.is_file(),
                    }

    # Discover team customizations
    custom_dir = project_root / CUSTOM_DIR
    team_skills = set()
    if custom_dir.is_dir():
        for f in sorted(custom_dir.iterdir()):
            if f.suffix == ".toml" and not f.name.endswith(".user.toml"):
                skill_name = f.stem
                team_skills.add(skill_name)
                if skill_name not in skills:
                    skills[skill_name] = {
                        "skill_root": None,
                        "has_customize_toml": False,
                    }

    result = {}
    for skill_name, info in sorted(skills.items()):
        skill_root = info["skill_root"]
        entry = {"skill_name": skill_name, "has_customize_toml": info["has_customize_toml"],
                 "customization_files": [], "resolved_keys": {}}

        # base
        base = {}
        if skill_root:
            base_path = os.path.join(skill_root, "customize.toml")
            base = load_toml(base_path)
            if os.path.isfile(base_path):
                entry["customization_files"].append(base_path)

        # team
        team = {}
        team_path = os.path.join(str(project_root), CUSTOM_DIR, f"{skill_name}.toml")
        team = load_toml(team_path)
        if os.path.isfile(team_path):
            entry["customization_files"].append(team_path)

        # user
        user = {}
        user_path = os.path.join(str(project_root), CUSTOM_DIR, f"{skill_name}.user.toml")
        user = load_toml(user_path)
        if os.path.isfile(user_path):
            entry["customization_files"].append(user_path)

        merged = deep_merge(base, deep_merge(team, user))
        entry["resolved_keys"] = merged
        result[skill_name] = entry

    # Write cache
    cache_dir = project_root / ".claude"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / ".resolved-customizations.json"

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # Force UTF-8 stdout on Windows
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    total = len(result)
    customized = sum(1 for s in result.values() if s["customization_files"])
    print(f"✅ resolve_all: {total} skills resolved ({customized} customized).")
    print(f"   Cache: {cache_path}")
    print(f"   Skills: {', '.join(sorted(result.keys()))}")


if __name__ == "__main__":
    main()
